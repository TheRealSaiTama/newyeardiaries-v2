import { supabase } from './supabase.js';

let _cache = null;
let _fetchedAt = null;
const CACHE_TTL = 60_000;

export async function getContent() {
  if (_cache && Date.now() - _fetchedAt < CACHE_TTL) return _cache;

  const [
    { data: siteSettings },
    { data: siteContent },
    { data: homepageSections },
    { data: announcements },
  ] = await Promise.all([
    supabase.from('site_settings').select('*'),
    supabase.from('site_content').select('*'),
    supabase.from('homepage_sections').select('*').order('sort_order'),
    supabase.from('announcements').select('*').order('created_at'),
  ]);

  _cache = {
    siteSettings: Object.fromEntries((siteSettings || []).map(s => [s.key, s.value])),
    siteContent: Object.fromEntries((siteContent || []).map(s => [`${s.section}.${s.key}`, s.value])),
    homepageSections: Object.fromEntries((homepageSections || []).map(s => [s.section_key, s])),
    announcements: (announcements || []).filter(a => a.active),
  };
  _fetchedAt = Date.now();
  return _cache;
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
  const texts = (content.announcements || []).map(a => a.text);
  const fallback = content.siteContent['header.announcement_text'] || '';
  const link = content.siteContent['header.announcement_link'] || '';
  return { texts, fallback, link };
}

export function getHeroContent(content) {
  return content.homepageSections['hero'] || null;
}

export function getCtaContent(content) {
  return content.homepageSections['cta'] || null;
}
