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
    category: p.category?.name || '',
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
    longDescription: p.short_description || p.description || '',
    tagline: p.tagline || '',
    image: (p.images && p.images[0]) || '',
    images: p.images || [],
    colors: p.colors || [],
    features: p.features || [],
    minBulkOrder: p.min_bulk_order || 1,
    inStock: p.in_stock !== false,
    active: p.active !== false,
    sortOrder: p.sort_order || 0,
  };
}

export async function getProducts() {
  if (_cache && Date.now() - _fetchedAt < CACHE_TTL) return _cache;
  const { data } = await supabase
    .from('products')
    .select('*, category:categories(name)')
    .eq('active', true)
    .order('sort_order');
  _cache = (data || []).map(normalize);
  _fetchedAt = Date.now();
  return _cache;
}

export async function getProductBySlug(slug) {
  const products = await getProducts();
  return products.find(p => p.slug === slug) || null;
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
  const { data } = await supabase
    .from('products')
    .select('*, category:categories(name)')
    .eq('category_id', cats.id)
    .eq('active', true)
    .order('sort_order');
  return (data || []).map(normalize);
}

export function formatPrice(price, currency = '₹') {
  return `${currency}${price.toLocaleString('en-IN')}`;
}

export const filters = {
  material: ['Full-grain Leather', 'Italian PU Leather', 'Vegan Leather', 'Woven Linen', 'Hardbound'],
  size: ['A4', 'A5', 'B5'],
  priceRange: [
    { label: 'Under ₹1,500', min: 0, max: 1500 },
    { label: '₹1,500 – ₹2,500', min: 1500, max: 2500 },
    { label: '₹2,500 – ₹4,000', min: 2500, max: 4000 },
    { label: 'Above ₹4,000', min: 4000, max: Infinity },
  ],
};
