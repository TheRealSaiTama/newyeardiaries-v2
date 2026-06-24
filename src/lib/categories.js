import { supabase } from './supabase.js';

// Fallback map — used ONLY if the category_groups table doesn't exist yet
// (i.e. before the user applies the migration). Once the migration is in,
// this map is ignored and groups come from the database.
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

// ============== CACHE ==============
// Cached categories (with embedded group) + cached group list. Both invalidate
// together when bustCategoriesCache() is called.
let _catCache = null;
let _catCacheAt = 0;
const CACHE_TTL_MS = 60_000; // 60s — admin changes propagate within a minute
const CAT_STORAGE_KEY = '__nyd_categories_cache';

export function bustCategoriesCache() {
  _catCache = null;
  _catCacheAt = 0;
  try {
    localStorage.removeItem(CAT_STORAGE_KEY);
  } catch (e) {}
}

// Fetch all categories WITH their group resolved. Falls back to the hardcoded
// map if the category_groups table doesn't exist yet (e.g. before the
// migration is applied).
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
    // Best-effort fetch of the groups table. If it doesn't exist (pre-migration),
    // silently fall back to the hardcoded map.
    try {
      const { data: g, error: gErr } = await supabase
        .from('category_groups')
        .select('id, name, sort_order')
        .order('sort_order');
      if (!gErr && g) groups = g;
    } catch (_) { /* table may not exist yet */ }

    const groupById = new Map();
    const groupByName = new Map();
    if (groups) {
      for (const g of groups) {
        groupById.set(g.id, g);
        groupByName.set(g.name, g);
      }
    }

    const fallbackNameForSlug = (slug) => {
      for (const [name, slugs] of Object.entries(CATEGORY_GROUPS_FALLBACK)) {
        if (slugs.includes(slug)) return name;
      }
      return null;
    };

    // Decorate each category with its group object (id, name) for the admin UI
    // and downstream consumers.
    const decorated = (cats || []).map(c => {
      let grp = null;
      if (c.group_id && groupById.has(c.group_id)) {
        grp = groupById.get(c.group_id);
      } else if (!c.group_id) {
        // No explicit group — try the fallback map (pre-migration data).
        const fbName = fallbackNameForSlug(c.slug);
        if (fbName && groupByName.has(fbName)) {
          grp = groupByName.get(fbName);
        } else if (fbName) {
          grp = { id: null, name: fbName, sort_order: 0 };
        }
      }
      return { ...c, group: grp, group_name: grp?.name || null };
    });

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

// Fetch just the groups list (DB-backed with fallback).
export async function fetchCategoryGroups() {
  // Reuse the same cache as fetchCategories by calling it (cheap on cache hit)
  await fetchCategories();

  try {
    const { data, error } = await supabase
      .from('category_groups')
      .select('id, name, sort_order')
      .order('sort_order');
    if (!error && data) return data;
  } catch (_) { /* table may not exist yet */ }

  // Fallback: derive from the hardcoded map
  return Object.keys(CATEGORY_GROUPS_FALLBACK).map((name, i) => ({
    id: null,
    name,
    sort_order: i + 1,
  }));
}

// Group categories by their group_name. Returns {groupName: [cats]}.
export function getCategoriesByGroup(categories) {
  const grouped = {};
  for (const c of categories || []) {
    const name = c.group_name || 'Uncategorized';
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(c);
  }
  return grouped;
}

// Legacy export — kept for ShopPage + any other consumer that needs the
// groupName -> [slug] map. Returns a plain object.
export function getGroupSlugsMap(categories) {
  const grouped = getCategoriesByGroup(categories);
  const out = {};
  for (const [name, cats] of Object.entries(grouped)) {
    out[name] = cats.map(c => c.slug);
  }
  return out;
}

// For ShopPage's `/shop?group=<name>` filter — synchronous, returns the slugs
// for a given group from the cached category list. The ShopPage awaits a
// loadHeaderCategories() call first so the cache is warm.
export function getCategorySlugsByGroupName(groupName, categories) {
  const grouped = getCategoriesByGroup(categories || []);
  return (grouped[groupName] || []).map(c => c.slug);
}

// Seed categories on first run if the table is empty.
export async function seedCategoriesIfEmpty() {
  if (localStorage.getItem('__nyd_categories_seeded') === 'true') return;

  const { data: existing } = await supabase.from('categories').select('slug');
  if (existing && existing.length > 0) {
    try {
      localStorage.setItem('__nyd_categories_seeded', 'true');
    } catch (e) {}
    return;
  }

  // Also try to seed groups if the table exists and is empty.
  const slugsByGroup = {};
  const flatList = [];
  for (const [group, slugs] of Object.entries(CATEGORY_GROUPS_FALLBACK)) {
    if (!slugsByGroup[group]) slugsByGroup[group] = [];
    for (const slug of slugs) {
      flatList.push({ slug, name: slug.replace(/-/g, ' '), group });
      slugsByGroup[group].push(slug);
    }
  }
  if (flatList.length) {
    const { error } = await supabase
      .from('categories')
      .insert(flatList.map((c, i) => ({
        slug: c.slug, name: c.slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
        sort_order: i + 1, active: true,
      })));
    if (error) throw error;
  }
  try {
    localStorage.setItem('__nyd_categories_seeded', 'true');
  } catch (e) {}
}

// Backwards-compat export so existing imports (e.g. ShopPage's static fallback)
// don't crash. Returns the hardcoded map directly — for SHOP FILTERING only.
// Real menu/header code should use getCategorySlugsByGroupName() against a
// fresh fetch.
export const CATEGORY_GROUPS = CATEGORY_GROUPS_FALLBACK;

// Look up the group(s) a category slug belongs to. Sync, uses cache if warm.
export function getCategoryGroupsForSlug(slug, categories) {
  const out = [];
  for (const c of categories || []) {
    if (c.slug === slug && c.group_name) out.push(c.group_name);
  }
  return out;
}
