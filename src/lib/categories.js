import { supabase } from './supabase.js';

const CATEGORY_GROUPS_FALLBACK = {
  'Corporate Gift Sets': [
    'corporate-gift-sets', 'bottles-gift-sets', 'diary-with-pen-gift-set',
    'employee-joining-kit', 'latest-product',
  ],
  'Business Gifts': [
    'laptop-bags', 'give-away-gifts', 'water-bottles', 'coffee-mug',
    'key-chains', 'promotional-umbrella',
  ],
  'New Year Diary': [
    'a-to-z-diary-collection', 'sunday-full-page-diary', 'corporate-diary',
    'executive-diary', 'engineering-diary', 'executive-folder-diary',
    'economy-diary', 'plain-diary',
  ],
  'Premium Diary': [
    'premium-diary', 'leather-diary', 'leather-planner', 'leather-planners',
  ],
  Calendars: ['table-calendar'],
  'Note Books & Pads': [
    'eco-friendly-memo-pads', 'notebook-with-pen', 'personalized-notebooks',
  ],
  'Leather Gifts': [
    'leather-gifts', 'certificate-folders', 'cheque-book-holders', 'leather-wallets',
  ],
  'Leather Planners': ['leather-planners', 'leather-planner'],
  'Promotional Gifts': [
    'card-holder', 'carry-bags', 'coffee-mug', 'key-chains', 'promotional-umbrella',
  ],
};

let _catCache = null;
let _catCacheAt = 0;
const CACHE_TTL_MS = 60_000; // 60s â€” admin changes propagate within a minute
const CAT_STORAGE_KEY = '__nyd_categories_cache';

export function bustCategoriesCache() {
  _catCache = null;
  _catCacheAt = 0;
  try {
    localStorage.removeItem(CAT_STORAGE_KEY);
  } catch (e) {}
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nyd-categories-updated'));
      if (typeof window.__clearPageCache === 'function') window.__clearPageCache();
    }
  } catch (e) { /* ignore */ }
}

export async function fetchCategories() {
  if (_catCache && Date.now() - _catCacheAt < CACHE_TTL_MS) return _catCache;

  if (!_catCache) {
    try {
      const stored = localStorage.getItem(CAT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        _catCache = parsed.data;
        _catCacheAt = parsed.fetchedAt;
      }
    } catch (e) {
      console.warn('[categories] failed to load localStorage cache:', e);
    }
  }

  if (_catCache) {
    const isStale = Date.now() - _catCacheAt >= CACHE_TTL_MS;
    if (isStale) {
      fetchCategoriesBackground();
    }
    return _catCache;
  }

  return fetchCategoriesFresh();
}

async function fetchCategoriesFresh() {
  try {
    const { data: cats, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');
    if (error) throw error;

    let groups = null;
    try {
      const { data: g, error: gErr } = await supabase
        .from('category_groups')
        .select('*')
        .order('sort_order');
      if (!gErr && g) groups = g;
    } catch (_) { /* table may not exist yet */ }

    const groupById = new Map();
    const groupByName = new Map();
    const groupByOrder = new Map();
    if (groups) {
      for (const g of groups) {
        groupById.set(g.id, g);
        groupByName.set(g.name, g);
        if (g.sort_order != null) groupByOrder.set(g.sort_order, g);
      }
    }

    const initialGroupOrderMap = new Map(
      Object.keys(CATEGORY_GROUPS_FALLBACK).map((name, i) => [name, i + 1])
    );

    const fallbackGroupForSlug = (slug) => {
      for (const [name, slugs] of Object.entries(CATEGORY_GROUPS_FALLBACK)) {
        if (slugs.includes(slug)) {
          if (groupByName.has(name)) return groupByName.get(name);
          const order = initialGroupOrderMap.get(name);
          if (order && groupByOrder.has(order)) return groupByOrder.get(order);
          const idx = (order || 1) - 1;
          if (groups && groups[idx]) return groups[idx];
          return { id: null, name, sort_order: order || 0 };
        }
      }
      return null;
    };

    const missingGroupIdUpdates = [];
    const decorated = (cats || []).map(c => {
      let grp = null;
      if (c.group_id && groupById.has(c.group_id)) {
        grp = groupById.get(c.group_id);
      } else {
        grp = fallbackGroupForSlug(c.slug);
        if (grp?.id && c.id && !c.group_id) {
          missingGroupIdUpdates.push({ id: c.id, group_id: grp.id });
        }
      }
      return { ...c, group_id: c.group_id || grp?.id || null, group: grp, group_name: grp?.name || null };
    });

    if (missingGroupIdUpdates.length > 0) {
      Promise.all(
        missingGroupIdUpdates.map(u =>
          supabase.from('categories').update({ group_id: u.group_id }).eq('id', u.id)
        )
      ).catch(() => {});
    }

    _catCache = decorated;
    _catCacheAt = Date.now();

    try {
      localStorage.setItem(CAT_STORAGE_KEY, JSON.stringify({ data: _catCache, fetchedAt: _catCacheAt }));
    } catch (e) {
      console.warn('[categories] failed to save to localStorage:', e);
    }

    return decorated;
  } catch (err) {
    console.error('[categories] fetchCategoriesFresh failed:', err);
    return _catCache || [];
  }
}

let _isFetchingCategoriesBackground = false;
async function fetchCategoriesBackground() {
  if (_isFetchingCategoriesBackground) return;
  _isFetchingCategoriesBackground = true;
  try {
    const oldCacheStr = JSON.stringify(_catCache);
    const fresh = await fetchCategoriesFresh();
    const newCacheStr = JSON.stringify(fresh);
    
    if (oldCacheStr !== newCacheStr) {
      console.log('[categories] categories updated in background, dispatching event');
      window.dispatchEvent(new CustomEvent('nyd-categories-updated', { detail: fresh }));
    }
  } catch (e) {
    console.warn('[categories] background fetch failed:', e);
  } finally {
    _isFetchingCategoriesBackground = false;
  }
}

export async function fetchCategoryGroups() {
  await fetchCategories();

  try {
    const { data, error } = await supabase
      .from('category_groups')
      .select('*')
      .order('sort_order');
    if (!error && data) return data;
  } catch (_) { /* table may not exist yet */ }

  return Object.keys(CATEGORY_GROUPS_FALLBACK).map((name, i) => ({
    id: null,
    name,
    sort_order: i + 1,
  }));
}

export function getCategoriesByGroup(categories) {
  const grouped = {};
  for (const c of categories || []) {
    const name = c.group_name || 'Uncategorized';
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(c);
  }
  return grouped;
}

export function getGroupSlugsMap(categories) {
  const grouped = getCategoriesByGroup(categories);
  const out = {};
  for (const [name, cats] of Object.entries(grouped)) {
    out[name] = cats.map(c => c.slug);
  }
  return out;
}

export function getCategorySlugsByGroupName(groupName, categories) {
  const grouped = getCategoriesByGroup(categories || []);
  return (grouped[groupName] || []).map(c => c.slug);
}

let _seedingPromise = null;
export async function seedCategoriesIfEmpty() {
  if (localStorage.getItem('__nyd_categories_seeded') === 'true') return;
  if (_seedingPromise) return _seedingPromise;

  _seedingPromise = (async () => {
    try {
      const { data: existing } = await supabase.from('categories').select('slug').limit(1);
      if (existing && existing.length > 0) {
        localStorage.setItem('__nyd_categories_seeded', 'true');
        return;
      }

      const { data: dbGroups, error: gError } = await supabase
        .from('category_groups')
        .select('id, name');
      
      const groupByName = new Map();
      if (!gError && dbGroups) {
        for (const g of dbGroups) {
          groupByName.set(g.name, g.id);
        }
      }

      if (groupByName.size === 0) {
        const groupPayload = Object.keys(CATEGORY_GROUPS_FALLBACK).map((name, idx) => ({
          name,
          sort_order: idx + 1
        }));
        const { data: insertedGroups, error: grpInsError } = await supabase
          .from('category_groups')
          .insert(groupPayload)
          .select('id, name');
        
        if (!grpInsError && insertedGroups) {
          for (const g of insertedGroups) {
            groupByName.set(g.name, g.id);
          }
        }
      }

      const uniqueCategories = new Map();
      let sortOrder = 1;
      for (const [groupName, slugs] of Object.entries(CATEGORY_GROUPS_FALLBACK)) {
        const groupId = groupByName.get(groupName) || null;
        for (const slug of slugs) {
          if (!uniqueCategories.has(slug)) {
            uniqueCategories.set(slug, {
              slug,
              name: slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
              group_id: groupId,
              sort_order: sortOrder++,
              active: true
            });
          }
        }
      }

      if (uniqueCategories.size > 0) {
        const payload = Array.from(uniqueCategories.values());
        const { error } = await supabase.from('categories').insert(payload);
        if (error) throw error;
      }

      localStorage.setItem('__nyd_categories_seeded', 'true');
    } catch (err) {
      console.error('[categories] Seeding failed:', err);
    }
  })();

  return _seedingPromise;
}

export const CATEGORY_GROUPS = CATEGORY_GROUPS_FALLBACK;

export function getCategoryGroupsForSlug(slug, categories) {
  const out = [];
  for (const c of categories || []) {
    if (c.slug === slug && c.group_name) out.push(c.group_name);
  }
  return out;
}
