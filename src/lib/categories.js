import { supabase } from './supabase.js';

const CATEGORY_GROUPS = {
  'Corporate Gift Sets': [
    'corporate-gift-sets', 'bottles-gift-sets', 'diary-with-pen-gift-set', 'employee-joining-kit', 'latest-product'
  ],
  'Business Gifts': [
    'laptop-bags', 'give-away-gifts', 'water-bottles', 'coffee-mug', 'key-chains', 'promotional-umbrella'
  ],
  'New Year Diary': [
    'a-to-z-diary-collection', 'sunday-full-page-diary', 'corporate-diary', 'executive-diary',
    'engineering-diary', 'executive-folder-diary', 'economy-diary', 'plain-diary'
  ],
  'Premium Diary': [
    'premium-diary', 'leather-diary', 'leather-planner', 'leather-planners'
  ],
  Calendars: [
    'table-calendar'
  ],
  'Note Books & Pads': [
    'eco-friendly-memo-pads', 'notebook-with-pen', 'personalized-notebooks'
  ],
  'Leather Gifts': [
    'leather-gifts', 'certificate-folders', 'cheque-book-holders', 'leather-wallets'
  ],
  'Leather Planners': [
    'leather-planners', 'leather-planner'
  ],
  'Promotional Gifts': [
    'card-holder', 'carry-bags', 'coffee-mug', 'key-chains', 'promotional-umbrella'
  ],
};

const CATEGORIES_TO_INSERT = [
  { slug: 'a-to-z-diary-collection', name: 'A to Z Diary Collection', group: 'New Year Diary' },
  { slug: 'bottles-gift-sets', name: 'Bottles Gift Sets', group: 'Corporate Gift Sets' },
  { slug: 'buy-diary-with-pen', name: 'Buy Diary with Pen', group: 'New Year Diary' },
  { slug: 'card-holder', name: 'Card Holder', group: 'Promotional Gifts' },
  { slug: 'carry-bags', name: 'Carry Bags', group: 'Promotional Gifts' },
  { slug: 'certificate-folders', name: 'Certificate Folders', group: 'Leather Gifts' },
  { slug: 'cheque-book-holders', name: 'Cheque Book Holders', group: 'Leather Gifts' },
  { slug: 'coffee-mug', name: 'Coffee Mug', group: 'Business Gifts' },
  { slug: 'corporate-diary', name: 'Corporate Diary', group: 'New Year Diary' },
  { slug: 'diary-with-pen-gift-set', name: 'Diary with Pen Gift Set', group: 'Corporate Gift Sets' },
  { slug: 'eco-friendly-memo-pads', name: 'Eco Friendly Memo Pads', group: 'Note Books & Pads' },
  { slug: 'economy-diary', name: 'Economy Diary', group: 'New Year Diary' },
  { slug: 'employee-joining-kit', name: 'Employee Joining Kit', group: 'Corporate Gift Sets' },
  { slug: 'engineering-diary', name: 'Engineering Diary', group: 'New Year Diary' },
  { slug: 'executive-diary', name: 'Executive Diary', group: 'New Year Diary' },
  { slug: 'executive-folder-diary', name: 'Executive Folder Diary', group: 'New Year Diary' },
  { slug: 'give-away-gifts', name: 'Give Away Gifts', group: 'Business Gifts' },
  { slug: 'key-chains', name: 'Key Chains', group: 'Promotional Gifts' },
  { slug: 'leather-planners', name: 'Leather Planners', group: 'Leather Planners' },
  { slug: 'laptop-bags', name: 'Laptop Bags', group: 'Business Gifts' },
  { slug: 'latest-product', name: 'Latest Product', group: 'Corporate Gift Sets' },
  { slug: 'leather-diary', name: 'Leather Diary', group: 'Premium Diary' },
  { slug: 'leather-planner', name: 'Leather Planner', group: 'Premium Diary' },
  { slug: 'leather-wallets', name: 'Leather Wallets', group: 'Leather Gifts' },
  { slug: 'notebook-with-pen', name: 'Notebook with Pen', group: 'Note Books & Pads' },
  { slug: 'plain-diary', name: 'Plain Diary', group: 'New Year Diary' },
  { slug: 'premium-diary', name: 'Premium Diary', group: 'Premium Diary' },
  { slug: 'promotional-umbrella', name: 'Promotional Umbrella', group: 'Promotional Gifts' },
  { slug: 'sunday-full-page-diary', name: 'Sunday Full Page Diary', group: 'New Year Diary' },
  { slug: 'table-calendar', name: 'Table Calendar', group: 'Calendars' },
  { slug: 'water-bottles', name: 'Water Bottles', group: 'Business Gifts' }
];

export { CATEGORY_GROUPS };

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order');

  if (error) throw error;
  return data || [];
}

export async function seedCategoriesIfEmpty() {
  const { data: existing } = await supabase.from('categories').select('slug');
  if (existing && existing.length > 0) return;

  const categoriesToInsert = CATEGORIES_TO_INSERT.map((cat, index) => ({
    slug: cat.slug,
    name: cat.name,
    sort_order: index + 1,
    active: true
  }));

  const { error } = await supabase.from('categories').insert(categoriesToInsert);
  if (error) throw error;
}

export function getCategoriesByGroup(categories) {
  const grouped = {};
  for (const group of Object.keys(CATEGORY_GROUPS)) {
    grouped[group] = categories.filter(c => CATEGORY_GROUPS[group].includes(c.slug));
  }
  return grouped;
}