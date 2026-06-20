import { supabase } from './supabase.js';

function normalize(product) {
  if (!product) return null;
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    title: product.name,
    category: product.category_id,
    categoryName: product.category?.name || '',
    material: product.material || '',
    size: product.size || '',
    pages: product.pages,
    price: Number(product.price) || 0,
    originalPrice: Number(product.original_price) || 0,
    sku: product.sku || '',
    badge: product.badge || '',
    description: product.description || '',
    shortDescription: product.short_description || '',
    longDescription: product.description || '',
    tagline: product.tagline || '',
    image: (product.images && product.images[0]) || '',
    images: product.images || [],
    colors: product.colors || [],
    features: product.features || [],
    hasShippingBadge: product.has_shipping_badge === true,
    hasWarrantyBadge: product.has_warranty_badge === true,
    tags: product.tags || '',
    minBulkOrder: product.min_bulk_order ?? 100,
    inStock: product.in_stock !== false,
    active: product.active !== false,
    sortOrder: product.sort_order || 0,
  };
}

export async function getProducts({ categoryId, limit, offset = 0, search } = {}) {
  let query = supabase
    .from('products')
    .select('*, category:categories!products_category_id_fkey(name)')
    .eq('active', true)
    .order('created_at', { ascending: false });

  let sortByJunction = null;
  let categorySlug = null;

  if (categoryId) {
    // Look up the category slug so we can apply the A to Z diary collection
    // alphabetical special-case for the homepage.
    const { data: catRow } = await supabase
      .from('categories')
      .select('slug')
      .eq('id', categoryId)
      .single();
    categorySlug = catRow?.slug || null;

    const { data: pcRows } = await supabase
      .from('product_categories')
      .select('product_id, sort_order')
      .eq('category_id', categoryId);
    const ids = (pcRows || []).map(r => r.product_id);
    sortByJunction = new Map((pcRows || []).map(r => [r.product_id, r.sort_order]));
    if (ids.length) {
      query = query.in('id', ids);
    } else {
      query = query.in('id', ['00000000-0000-0000-0000-000000000000']);
    }
  }

  query = query.range(offset, offset + (limit || 100) - 1);

  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error } = await query;
  if (error) { console.error(error); return []; }
  const rows = (data || []).map(p => {
    const n = normalize(p);
    if (sortByJunction) n.categorySortOrder = sortByJunction.get(p.id) ?? null;
    return n;
  });

  // When filtered by category, use the per-category sort. The A to Z
  // diary collection always sorts alphabetically.
  if (categoryId && sortByJunction) {
    if (categorySlug === 'a-to-z-diary-collection') {
      rows.sort((a, b) => (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase()));
    } else {
      rows.sort((a, b) => {
        const sa = a.categorySortOrder;
        const sb = b.categorySortOrder;
        if (sa == null && sb == null) return 0;
        if (sa == null) return 1;
        if (sb == null) return -1;
        return sa - sb;
      });
    }
  }
  return rows;
}

export async function getProductBySlug(slug) {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories!products_category_id_fkey(name)')
    .eq('slug', slug)
    .single();
  if (error) return null;
  return normalize(data);
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


const LOCAL_CAT_IMAGES = {
  'a-to-z-diary-collection': '/images/categories/note-book-diary.jpg',
  'bottles-gift-sets': '/images/categories/bottles-gift-sets.jpg',
  'buy-diary-with-pen': '/images/categories/diary-with-pen.jpg',
  'carry-bags': '/images/categories/business-gifts.jpg',
  'certificate-folders': '/images/categories/leather-gifts.jpg',
  'cheque-book-holders': '/images/categories/leather-gifts.jpg',
  'coffee-mug': '/images/categories/business-gifts.jpg',
  'corporate-diary': '/images/categories/corporate-diary.jpg',
  'diary-with-pen-gift-set': '/images/categories/diary-with-pen.jpg',
  'eco-friendly-memo-pads': '/images/categories/note-book-diary.jpg',
  'economy-diary': '/images/categories/art-cover-diary.jpg',
  'employee-joining-kit': '/images/categories/corporate-gift-sets.jpg',
  'engineering-diary': '/images/categories/engineering-diary.jpg',
  'executive-diary': '/images/categories/executive-diary.jpg',
  'executive-folder-diary': '/images/categories/corporate-diary.jpg',
  'give-away-gifts': '/images/categories/give-away-gifts.jpg',
  'key-chains': '/images/categories/business-gifts.jpg',
  'leather-planners': '/images/categories/premium-diary.jpg',
  'laptop-bags': '/images/categories/business-gifts.jpg',
  'latest-product': '/images/categories/latest-diary-collection.jpg',
  'leather-diary': '/images/categories/premium-diary.jpg',
  'leather-planner': '/images/categories/premium-diary.jpg',
  'leather-wallets': '/images/categories/leather-gifts.jpg',
  'notebook-with-pen': '/images/categories/diary-with-pen.jpg',
  'plain-diary': '/images/categories/note-book-diary.jpg',
  'premium-diary': '/images/categories/premium-diary.jpg',
  'promotional-umbrella': '/images/categories/business-gifts.jpg',
  'sunday-full-page-diary': '/images/categories/executive-diary.jpg',
  'table-calendar': '/images/categories/table-calendar.jpg',
  'water-bottles': '/images/categories/bottles-gift-sets.jpg',
  'personalized-notebooks': '/images/categories/note-book-diary.jpg',
  'pu-leather-diary': '/images/categories/pu-leather-diary.jpg',
  'leather-planners-2': '/images/categories/premium-diary.jpg',
};

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, icon, description, image_url, sort_order, active')
    .eq('active', true)
    .order('sort_order');
  if (error) return [];
  return (data || []).map(cat => ({
    ...cat,
    image_url: cat.image_url || LOCAL_CAT_IMAGES[cat.slug] || '/images/placeholder.jpg',
  }));
}
