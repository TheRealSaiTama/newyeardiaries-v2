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
  };
}

export async function getProducts() {
  if (_cache && Date.now() - _fetchedAt < CACHE_TTL) return _cache;

  // Fetch products with their primary category's name+slug, AND the full
  // product_categories junction so we know every category a product belongs to.
  const [prodRes, juncRes] = await Promise.all([
    supabase
      .from('products')
      .select('*, category:categories!products_category_id_fkey(name, slug)')
      .eq('active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('product_categories')
      .select('product_id, category_id, category:categories!product_categories_category_id_fkey(slug)'),
  ]);

  const products = prodRes.data || [];
  // Build a map: productId -> array of category slugs (from the junction)
  const extraSlugsByProduct = new Map();
  for (const row of juncRes.data || []) {
    const slug = row.category?.slug;
    if (!slug) continue;
    const list = extraSlugsByProduct.get(row.product_id) || [];
    list.push(slug);
    extraSlugsByProduct.set(row.product_id, list);
  }

  _cache = products.map(p => {
    const base = normalize(p);
    // categorySlugs: [primary slug, ...all junction slugs], deduped
    const allSlugs = [base.categorySlug, ...(extraSlugsByProduct.get(p.id) || [])]
      .filter(Boolean);
    base.categorySlugs = Array.from(new Set(allSlugs));
    return base;
  });
  _fetchedAt = Date.now();
  return _cache;
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
    .select('id')
    .eq('slug', categorySlug)
    .single();
  if (!cats) return [];
  const { data: pcRows } = await supabase
    .from('product_categories')
    .select('product_id')
    .eq('category_id', cats.id);
  const ids = (pcRows || []).map(r => r.product_id);
  if (!ids.length) return [];
  const { data } = await supabase
    .from('products')
    .select('*, category:categories!products_category_id_fkey(name, slug)')
    .in('id', ids)
    .eq('active', true)
    .order('sort_order');
  return (data || []).map(normalize);
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
