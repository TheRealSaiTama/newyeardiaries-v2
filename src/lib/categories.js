import { supabase } from './supabase.js';

const CATEGORY_GROUPS = {
  'Corporate Gift Sets': [
    'corporate-gift-sets', '2-in-1-gift-sets', '3-in-1-gift-sets', '4-in-1-gift-sets',
    'bottles-gift-sets', 'diary-with-pen-gift-set', 'employee-joining-kit', 'latest-product'
  ],
  'Business Gifts': [
    'business-gifts', 'eco-friendly-memo-pad', 'laptop-bags',
    'give-away-gifts', 'water-bottles'
  ],
  'New Year Diary': [
    'new-year-diary', 'latest-diary-collection', 'sunday-full-page-diary', 'art-cover-diary',
    'corporate-diary', 'customized-diary', 'diary-with-pen', 'executive-diary',
    'planner-diary', 'engineering-diary', 'doctor-diary', 'executive-folder-diary',
    'leather-table-planners', 'best-sellers-1', 'latest-products-1'
  ],
  'Premium Diary': [
    'premium-diary', 'leather-diary', 'pu-leather-diary', 'diary-with-power-bank',
    'number-lock-diary', 'normal-dairy'
  ],
  Calendars: [
    'calendars', 'table-calendar'
  ],
  'Customized Note Books': [
    'customized-note-books', 'notebook-with-pen', 'personalized-notebooks'
  ],
  'Leather Gifts': [
    'leather-gifts', 'certificate-folders', 'cheque-book-holders', 'leather-wallets'
  ],
  'Leather Planners': [
    'leather-planners', 'pu-leather-planners'
  ],
  'Promotional Gifts': [
    'promotional-gifts', 'card-holder', 'carry-bags', 'coffee-mug', 'key-chains',
    'mouse-pad', 'pen-stand', 'promotional-pens', 'metal-pens', 'plastic-pens',
    'promotional-umbrella', 't-shirts-printing'
  ],
};

const CATEGORIES_TO_INSERT = [
  { slug: 'corporate-gift-sets', title: 'Corporate Gift Sets', group: 'Corporate Gift Sets' },
  { slug: '2-in-1-gift-sets', title: '2 in 1 Gift Sets', group: 'Corporate Gift Sets' },
  { slug: '3-in-1-gift-sets', title: '3 in 1 Gift Sets', group: 'Corporate Gift Sets' },
  { slug: '4-in-1-gift-sets', title: '4 in 1 Gift Sets', group: 'Corporate Gift Sets' },
  { slug: 'bottles-gift-sets', title: 'Bottles Gift Sets', group: 'Corporate Gift Sets' },
  { slug: 'diary-with-pen-gift-set', title: 'Diary With Pen Gift Set', group: 'Corporate Gift Sets' },
  { slug: 'employee-joining-kit', title: 'Employee Joining Kit', group: 'Corporate Gift Sets' },
  { slug: 'latest-product', title: 'Latest Product', group: 'Corporate Gift Sets' },
  { slug: 'business-gifts', title: 'Business Gifts', group: 'Business Gifts' },
  { slug: 'eco-friendly-memo-pad', title: 'Eco Friendly Memo Pad', group: 'Business Gifts' },
  { slug: 'laptop-bags', title: 'Laptop Bags', group: 'Business Gifts' },
  { slug: 'give-away-gifts', title: 'Give Away Gifts', group: 'Business Gifts' },
  { slug: 'water-bottles', title: 'Water Bottles', group: 'Business Gifts' },
  { slug: 'new-year-diary', title: 'New Year Diary', group: 'New Year Diary' },
  { slug: 'latest-diary-collection', title: 'Latest Diary Collection', group: 'New Year Diary' },
  { slug: 'sunday-full-page-diary', title: 'Sunday Full Page Diary', group: 'New Year Diary' },
  { slug: 'art-cover-diary', title: 'Art Cover Diary', group: 'New Year Diary' },
  { slug: 'corporate-diary', title: 'Corporate Diary', group: 'New Year Diary' },
  { slug: 'customized-diary', title: 'Customized Diary', group: 'New Year Diary' },
  { slug: 'diary-with-pen', title: 'Diary With Pen', group: 'New Year Diary' },
  { slug: 'executive-diary', title: 'Executive Diary', group: 'New Year Diary' },
  { slug: 'planner-diary', title: 'Planner Diary', group: 'New Year Diary' },
  { slug: 'engineering-diary', title: 'Engineering Diary', group: 'New Year Diary' },
  { slug: 'doctor-diary', title: 'Doctor Diary', group: 'New Year Diary' },
  { slug: 'executive-folder-diary', title: 'Executive Folder Diary', group: 'New Year Diary' },
  { slug: 'leather-table-planners', title: 'Leather Table Planners', group: 'New Year Diary' },
  { slug: 'best-sellers-1', title: 'Best Sellers', group: 'New Year Diary' },
  { slug: 'latest-products-1', title: 'Latest Products', group: 'New Year Diary' },
  { slug: 'premium-diary', title: 'Premium Diary', group: 'Premium Diary' },
  { slug: 'leather-diary', title: 'Leather Diary', group: 'Premium Diary' },
  { slug: 'pu-leather-diary', title: 'PU Leather Diary', group: 'Premium Diary' },
  { slug: 'diary-with-power-bank', title: 'Diary With Power Bank', group: 'Premium Diary' },
  { slug: 'number-lock-diary', title: 'Number Lock Diary', group: 'Premium Diary' },
  { slug: 'normal-dairy', title: 'Normal Dairy', group: 'Premium Diary' },
  { slug: 'calendars', title: 'Calendars', group: 'Calendars' },
  { slug: 'table-calendar', title: 'Table Calendar', group: 'Calendars' },
  { slug: 'customized-note-books', title: 'Customized Note Books', group: 'Customized Note Books' },
  { slug: 'notebook-with-pen', title: 'Notebook With Pen', group: 'Customized Note Books' },
  { slug: 'personalized-notebooks', title: 'Personalized Notebooks', group: 'Customized Note Books' },
  { slug: 'leather-gifts', title: 'Leather Gifts', group: 'Leather Gifts' },
  { slug: 'certificate-folders', title: 'Certificate Folders', group: 'Leather Gifts' },
  { slug: 'cheque-book-holders', title: 'Cheque Book Holders', group: 'Leather Gifts' },
  { slug: 'leather-wallets', title: 'Leather Wallets', group: 'Leather Gifts' },
  { slug: 'leather-planners', title: 'Leather Planners', group: 'Leather Planners' },
  { slug: 'pu-leather-planners', title: 'PU Leather Planners', group: 'Leather Planners' },
  { slug: 'promotional-gifts', title: 'Promotional Gifts', group: 'Promotional Gifts' },
  { slug: 'card-holder', title: 'Card Holder', group: 'Promotional Gifts' },
  { slug: 'carry-bags', title: 'Carry Bags', group: 'Promotional Gifts' },
  { slug: 'coffee-mug', title: 'Coffee Mug', group: 'Promotional Gifts' },
  { slug: 'key-chains', title: 'Key Chains', group: 'Promotional Gifts' },
  { slug: 'mouse-pad', title: 'Mouse Pad', group: 'Promotional Gifts' },
  { slug: 'pen-stand', title: 'Pen Stand', group: 'Promotional Gifts' },
  { slug: 'promotional-pens', title: 'Promotional Pens', group: 'Promotional Gifts' },
  { slug: 'metal-pens', title: 'Metal Pens', group: 'Promotional Gifts' },
  { slug: 'plastic-pens', title: 'Plastic Pens', group: 'Promotional Gifts' },
  { slug: 'promotional-umbrella', title: 'Promotional Umbrella', group: 'Promotional Gifts' },
  { slug: 't-shirts-printing', title: 'T-Shirts Printing', group: 'Promotional Gifts' }
];

export { CATEGORY_GROUPS };

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('title');

  if (error) throw error;
  return data || [];
}

export async function seedCategoriesIfEmpty() {
  const { data: existing } = await supabase.from('categories').select('slug');
  if (existing && existing.length > 0) return;

  const categoriesToInsert = CATEGORIES_TO_INSERT.map((cat, index) => ({
    slug: cat.slug,
    name: cat.title,
    group_name: cat.group,
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