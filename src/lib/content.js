import { supabase } from './supabase.js';

let _cache = null;
let _fetchedAt = null;
const CACHE_TTL = 60_000;

const CONTENT_STORAGE_KEY = '__nyd_content_cache';
const CONTENT_CACHE_VERSION = 3;

function stripHeavy(value) {
  if (value == null) return value;
  if (typeof value === 'string') {
    if (value.startsWith('data:') && value.length > 200) return '';
    if (value.length > 50000) return value.slice(0, 50000);
    return value;
  }
  if (Array.isArray(value)) return value.map(stripHeavy);
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (/image|logo|map_embed|banner|photo|thumbnail|html|content/i.test(k) && typeof v === 'string' && v.startsWith('data:')) {
        out[k] = '';
        continue;
      }
      out[k] = stripHeavy(v);
    }
    return out;
  }
  return value;
}

function slimContentForStorage(data) {
  if (!data || typeof data !== 'object') return data;
  return {
    siteSettings: stripHeavy(data.siteSettings || {}),
    siteContent: stripHeavy(data.siteContent || {}),
    homepageSections: stripHeavy(data.homepageSections || {}),
    announcements: (data.announcements || []).map((a) => ({
      id: a.id,
      text: a.text,
      link: a.link,
      active: a.active,
      sort_order: a.sort_order,
    })),
    footerSections: stripHeavy(data.footerSections || {}),
    banners: [],
    trustBadges: (data.trustBadges || []).map((b) => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      icon: typeof b.icon === 'string' && b.icon.startsWith('data:') ? '' : b.icon,
      position: b.position,
      active: b.active,
    })),
    sliderSections: data.sliderSections || [],
    sliderItems: data.sliderItems || [],
    shopCategories: [],
  };
}

function isUsableStoredCache(data) {
  if (!data || typeof data !== 'object') return false;
  const cats = data.shopCategories || [];
  if (cats.length > 0) {
    const missingLabel = cats.some((c) => !(c.title || c.name));
    const allBlankImages = cats.every((c) => !c.image_url);
    if (missingLabel || allBlankImages) return false;
  }
  const banners = data.banners || [];
  if (banners.length > 0 && banners.every((b) => !b.image_url)) return false;
  return true;
}

function clearNydStorageKeys() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('__nyd') || k.startsWith('nyd') || k.includes('page_cache'))) keys.push(k);
    }
    keys.forEach((k) => {
      try { localStorage.removeItem(k); } catch (_) {}
    });
  } catch (_) {}
}

function persistContentCache(data, fetchedAt) {
  const payload = JSON.stringify({
    v: CONTENT_CACHE_VERSION,
    data: slimContentForStorage(data),
    fetchedAt,
  });
  try {
    localStorage.setItem(CONTENT_STORAGE_KEY, payload);
    return true;
  } catch (_) {
    try {
      clearNydStorageKeys();
      localStorage.setItem(CONTENT_STORAGE_KEY, payload);
      return true;
    } catch (_) {
      try { localStorage.removeItem(CONTENT_STORAGE_KEY); } catch (__) {}
      return false;
    }
  }
}

export function bustContentCache() {
  _cache = null;
  _fetchedAt = null;
  try {
    localStorage.removeItem(CONTENT_STORAGE_KEY);
  } catch (e) {}
  try {
    if (typeof window !== 'undefined') {
      fetchContentFresh()
        .then((fresh) => {
          window.dispatchEvent(new CustomEvent('nyd-content-updated', { detail: fresh }));
        })
        .catch(() => {
          window.dispatchEvent(new CustomEvent('nyd-content-updated', { detail: null }));
        });
      if (typeof window.__clearPageCache === 'function') window.__clearPageCache();
    }
  } catch (e) {}
}

export async function getContent() {
  if (_cache && Date.now() - _fetchedAt < CACHE_TTL) return _cache;

  if (!_cache) {
    try {
      const stored = localStorage.getItem(CONTENT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.v === CONTENT_CACHE_VERSION && isUsableStoredCache(parsed.data)) {
          _cache = parsed.data;
          _fetchedAt = parsed.fetchedAt;
        } else {
          localStorage.removeItem(CONTENT_STORAGE_KEY);
        }
      }
    } catch (e) {
      console.warn('[content] failed to load localStorage cache:', e);
      try { localStorage.removeItem(CONTENT_STORAGE_KEY); } catch (_) {}
    }
  }

  if (_cache) {
    const missingVisuals =
      !(_cache.shopCategories && _cache.shopCategories.length) &&
      !(_cache.banners && _cache.banners.length);
    if (missingVisuals) {
      return fetchContentFresh();
    }
    const isStale = Date.now() - _fetchedAt >= CACHE_TTL;
    if (isStale) {
      fetchContentBackground();
    }
    return _cache;
  }

  return fetchContentFresh();
}

async function fetchContentFresh() {
  // H3.27: per-query isolation — one failed table no longer blanks all content
  const safe = async (label, promise) => {
    try {
      const { data, error } = await promise;
      if (error) {
        console.warn(`[content] ${label}:`, error.message);
        return null;
      }
      return data;
    } catch (e) {
      console.warn(`[content] ${label} threw:`, e);
      return null;
    }
  };

  try {
    const [
      siteSettings,
      siteContent,
      homepageSections,
      announcements,
      footerSections,
      banners,
      trustBadges,
      sliderSections,
      sliderItems,
      shopCategories,
    ] = await Promise.all([
      safe('site_settings', supabase.from('site_settings').select('*')),
      safe('site_content', supabase.from('site_content').select('*')),
      safe('homepage_sections', supabase.from('homepage_sections').select('*').order('sort_order')),
      safe('announcements', supabase.from('announcements').select('*').order('created_at')),
      safe('footer_sections', supabase.from('footer_sections').select('*').eq('active', true).order('sort_order')),
      safe('banners', supabase.from('banners').select('*').eq('active', true).order('order_index')),
      safe('trust_badges', supabase.from('trust_badges').select('*').order('position')),
      safe('slider_sections', supabase.from('homepage_slider_sections').select('*').eq('active', true).order('sort_order')),
      safe('slider_items', supabase.from('homepage_slider_items').select('*').order('position')),
      safe('shop_categories', supabase.from('shop_categories').select('*').eq('active', true).order('sort_order')),
    ]);

    const prev = _cache || {};
    const newCache = {
      siteSettings: siteSettings
        ? Object.fromEntries(siteSettings.map(s => [s.key, s.value]))
        : (prev.siteSettings || {}),
      siteContent: siteContent
        ? Object.fromEntries(siteContent.map(s => [`${s.section}.${s.key}`, s.value]))
        : (prev.siteContent || {}),
      homepageSections: homepageSections
        ? Object.fromEntries(homepageSections.map(s => [s.section_key, s]))
        : (prev.homepageSections || {}),
      announcements: announcements
        ? announcements.filter(a => a.active)
        : (prev.announcements || []),
      footerSections: footerSections
        ? Object.fromEntries(footerSections.map(s => [s.section_key, s]))
        : (prev.footerSections || {}),
      banners: banners || prev.banners || [],
      trustBadges: trustBadges
        ? trustBadges.filter(b => b.active !== false)
        : (prev.trustBadges || []),
      sliderSections: sliderSections || prev.sliderSections || [],
      sliderItems: sliderItems || prev.sliderItems || [],
      shopCategories: shopCategories || prev.shopCategories || [],
    };

    _cache = newCache;
    _fetchedAt = Date.now();
    persistContentCache(_cache, _fetchedAt);

    return _cache;
  } catch (err) {
    console.error('[content] fetchContentFresh failed:', err);
    return _cache || {};
  }
}

let _isFetchingBackground = false;
async function fetchContentBackground() {
  if (_isFetchingBackground) return;
  _isFetchingBackground = true;
  try {
    const oldCacheStr = JSON.stringify(_cache);
    const fresh = await fetchContentFresh();
    const newCacheStr = JSON.stringify(fresh);
    
    if (oldCacheStr !== newCacheStr) {
      console.log('[content] site content updated in background, dispatching event');
      window.dispatchEvent(new CustomEvent('nyd-content-updated', { detail: fresh }));
    }
  } catch (e) {
    console.warn('[content] background fetch failed:', e);
  } finally {
    _isFetchingBackground = false;
  }
}

export function getFooterContent(content) {
  return {
    tagline: content.siteSettings?.footer_tagline || content.siteSettings?.tagline || content.siteContent?.['footer.tagline'] || '',
    address: content.siteSettings?.contact_address || content.siteContent?.['footer.address'] || '',
    phone: content.siteSettings?.contact_phone || content.siteContent?.['footer.phone'] || '',
    phone2: content.siteSettings?.contact_phone2 || content.siteContent?.['footer.phone2'] || '',
    email: content.siteSettings?.contact_email || content.siteContent?.['footer.email'] || '',
    hours: content.siteSettings?.footer_hours || content.siteContent?.['footer.hours'] || '',
    copyright: content.siteSettings?.footer_copyright || content.siteContent?.['footer.copyright'] || '',
    facebook: content.siteSettings?.facebook_url || content.siteContent?.['footer.facebook_url'] || '',
    instagram: content.siteSettings?.instagram_url || content.siteContent?.['footer.instagram_url'] || '',
    twitter: content.siteSettings?.twitter_url || content.siteContent?.['footer.twitter_url'] || '',
    youtube: content.siteSettings?.youtube_url || content.siteContent?.['footer.youtube_url'] || '',
    paymentIcons: content.siteSettings?.payment_icons_url || '/images/payment-icons-transparent.png',
    mapEmbed: content.siteSettings?.map_embed_url || '',
  };
}

export function getAnnouncementContent(content) {
  const texts = (content?.announcements || []).map(a => a?.text).filter(Boolean);
  const fallback = content?.siteContent?.['header.announcement_text'] || '';
  const link = content?.siteContent?.['header.announcement_link'] || '';
  return { texts, fallback, link };
}

export function getHeroContent(content) {
  return content?.homepageSections?.['hero'] || null;
}

export function getCtaContent(content) {
  return content?.homepageSections?.['cta'] || null;
}

export function getTrustBadges(content) {
  return (content?.trustBadges || []).slice().sort((a, b) => (a.position || 0) - (b.position || 0));
}

// Returns the list of homepage slider sections, each with its products
// pre-resolved and in display order. Empty list if the table is missing
// or has no rows.
export function getHomepageSliders(content) {
  const sections = (content?.sliderSections || []).slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const items = content?.sliderItems || [];
  return sections.map(sec => {
    const secItems = items
      .filter(it => it.section_id === sec.id)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
    return {
      id: sec.id,
      key: sec.key,
      title: sec.title,
      view_all_link: sec.view_all_link,
      bg: sec.bg_color || '#FAF8F5',
      categorySlug: sec.category_slug || null,
      productIds: secItems.map(it => it.product_id),
    };
  });
}
