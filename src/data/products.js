import { supabase } from '../lib/supabase.js';

let _cache = null;
let _fetchedAt = null;
const CACHE_TTL = 30_000;

function normalize(p) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    title: p.name,
    // `category` is the display NAME (legacy). Prefer `categorySlug` for filtering.
    category: p.category?.name || '',
    categorySlug: p.category?.slug || '',
    categoryId: p.category_id || '',
    material: p.material || '',
    size: p.size || '',
    pages: p.pages,
    price: Number(p.price) || 0,
    originalPrice: Number(p.original_price) || 0,
    currency: '₹',
    sku: p.sku || '',
    badge: p.badge || '',
    description: p.description || '',
    shortDescription: p.short_description || '',
    longDescription: p.description || '',
    tagline: p.tagline || '',
    image: (p.images && p.images[0]) || '',
    images: p.images || [],
    colors: p.colors || [],
    features: p.features || [],
    hasShippingBadge: p.has_shipping_badge === true,
    hasWarrantyBadge: p.has_warranty_badge === true,
    tags: p.tags || '',
    minBulkOrder: p.min_bulk_order ?? 100,
    inStock: p.in_stock !== false,
    active: p.active !== false,
    sortOrder: p.sort_order || 0,
    createdAt: p.created_at,
  };
}

const PRODUCTS_STORAGE_KEY = '__nyd_products_cache';

export function bustProductsCache() {
  _cache = null;
  _fetchedAt = null;
  try {
    localStorage.removeItem(PRODUCTS_STORAGE_KEY);
  } catch (e) {}
}

export async function getProducts() {
  if (_cache && Date.now() - _fetchedAt < CACHE_TTL) return _cache;

  if (!_cache) {
    try {
      const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        _cache = parsed.data;
        _fetchedAt = parsed.fetchedAt;
      }
    } catch (e) {
      console.warn('[products] failed to load localStorage cache:', e);
    }
  }

  if (_cache) {
    const isStale = Date.now() - _fetchedAt >= CACHE_TTL;
    if (isStale) {
      fetchProductsBackground();
    }
    return _cache;
  }

  return fetchProductsFresh();
}

async function fetchProductsFresh() {
  try {
    // Fetch products with their primary category's name+slug, AND the full
    // product_categories junction so we know every category a product belongs to
    // AND its per-category sort_order (1..100).
    const [prodRes, juncRes] = await Promise.all([
      supabase
        .from('products')
        .select('*, category:categories!products_category_id_fkey(name, slug)')
        .eq('active', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('product_categories')
        .select('product_id, category_id, sort_order, category:categories!product_categories_category_id_fkey(slug)'),
    ]);

    const products = prodRes.data || [];
    // Build a map: productId -> array of category slugs (from the junction)
    const extraSlugsByProduct = new Map();
    // Build a map: productId -> { slug -> sort_order } for per-category sort
    const sortByProductSlug = new Map();
    for (const row of juncRes.data || []) {
      const slug = row.category?.slug;
      if (!slug) continue;
      const list = extraSlugsByProduct.get(row.product_id) || [];
      if (!list.includes(slug)) list.push(slug);
      extraSlugsByProduct.set(row.product_id, list);
      if (row.sort_order != null) {
        const m = sortByProductSlug.get(row.product_id) || {};
        m[slug] = row.sort_order;
        sortByProductSlug.set(row.product_id, m);
      }
    }

    const newCache = products.map(p => {
      const base = normalize(p);
      // categorySlugs: [primary slug, ...all junction slugs], deduped
      const allSlugs = [base.categorySlug, ...(extraSlugsByProduct.get(p.id) || [])]
        .filter(Boolean);
      base.categorySlugs = Array.from(new Set(allSlugs));
      // categorySortOrders: { [slug]: order } for per-category sort
      base.categorySortOrders = sortByProductSlug.get(p.id) || {};
      return base;
    });

    _cache = newCache;
    _fetchedAt = Date.now();

    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify({ data: _cache, fetchedAt: _fetchedAt }));
    } catch (e) {
      console.warn('[products] failed to save to localStorage:', e);
    }

    return _cache;
  } catch (err) {
    console.error('[products] fetchProductsFresh failed:', err);
    return _cache || [];
  }
}

let _isFetchingProductsBackground = false;
async function fetchProductsBackground() {
  if (_isFetchingProductsBackground) return;
  _isFetchingProductsBackground = true;
  try {
    const oldCacheStr = JSON.stringify(_cache);
    const fresh = await fetchProductsFresh();
    const newCacheStr = JSON.stringify(fresh);
    
    if (oldCacheStr !== newCacheStr) {
      console.log('[products] products updated in background, dispatching event');
      window.dispatchEvent(new CustomEvent('nyd-products-updated', { detail: fresh }));
    }
  } catch (e) {
    console.warn('[products] background fetch failed:', e);
  } finally {
    _isFetchingProductsBackground = false;
  }
}

export async function getProductBySlug(slug) {
  const products = await getProducts();
  return products.find(p => p.slug === slug || p.id === slug) || null;
}

export async function getProductById(id) {
  const products = await getProducts();
  return products.find(p => p.id === id || p.id === String(id)) || null;
}

export async function getProductsByCategory(categorySlug) {
  const { data: cats } = await supabase
    .from('categories')
    .select('id, slug')
    .eq('slug', categorySlug)
    .single();
  if (!cats) return [];

  // Pull the junction rows for this category — they carry the per-category
  // sort_order (1..100) that controls the display order on category pages.
  const { data: pcRows } = await supabase
    .from('product_categories')
    .select('product_id, sort_order')
    .eq('category_id', cats.id);
  const ids = (pcRows || []).map(r => r.product_id);
  if (!ids.length) return [];

  const { data: products } = await supabase
    .from('products')
    .select('*, category:categories!products_category_id_fkey(name, slug)')
    .in('id', ids)
    .eq('active', true);
  if (!products) return [];

  const sortByJunction = new Map();
  (pcRows || []).forEach(r => {
    if (r.sort_order != null) sortByJunction.set(r.product_id, r.sort_order);
  });

  // Attach per-category sortOrder to each product so the admin / sort UI
  // can see the current value for THIS category (not the product's global
  // products.sort_order).
  const normalized = products.map(p => {
    const base = normalize(p);
    base.categorySortOrder = sortByJunction.get(p.id) ?? null;
    return base;
  });

  // Sort logic
  const isAZ = cats.slug === 'a-to-z-diary-collection';
  if (isAZ) {
    // A to Z diary collection: alphabetical (case-insensitive) regardless
    // of the per-category sort_order.
    normalized.sort((a, b) =>
      (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase())
    );
  } else {
    // Per-category sort_order ASC, then name ASC as tiebreaker for unsorted
    // products. Products without a sort_order float to the end.
    normalized.sort((a, b) => {
      const sa = a.categorySortOrder;
      const sb = b.categorySortOrder;
      if (sa == null && sb == null) return (a.name || '').localeCompare(b.name || '');
      if (sa == null) return 1;
      if (sb == null) return -1;
      if (sa !== sb) return sa - sb;
      return (a.name || '').localeCompare(b.name || '');
    });
  }
  return normalized;
}

export function formatPrice(price, currency = '₹') {
  return `${currency}${price.toLocaleString('en-IN')}`;
}

export async function getReviewsByProduct(productId) {
  const { data, error } = await supabase
    .from('product_reviews')
    .select('*')
    .eq('product_id', productId)
    .eq('active', true)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function addReview(productId, reviewerName, rating, reviewText) {
  const { data, error } = await supabase
    .from('product_reviews')
    .insert({ product_id: productId, reviewer_name: reviewerName, rating, review_text: reviewText })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getCategories() {
  const { data } = await supabase.from('categories').select('id, name, slug').eq('active', true).order('sort_order');
  return data || [];
}

export const filters = {
  material: ['Leather', 'PU Leather', 'Vegan Leather', 'Linen', 'Hardbound'],
  size: ['A4', 'A5', 'B5'],
  priceRange: [
    { label: 'Under ₹100', min: 0, max: 100 },
    { label: '₹100 – ₹300', min: 100, max: 300 },
    { label: '₹300 – ₹500', min: 300, max: 500 },
    { label: '₹500 – ₹1,000', min: 500, max: 1000 },
    { label: '₹1,000 – ₹2,000', min: 1000, max: 2000 },
  ],
};
