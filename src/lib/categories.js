import { supabase } from './supabase.js';

const CATEGORY_GROUPS = {
  Diaries: [
    'new-year-diary', 'latest-diary-collection', 'art-cover-diary', 'diary-with-pen',
    'corporate-diary', 'customized-diary', 'doctor-diary', 'engineering-diary',
    'executive-diary', 'executive-folder-diary', 'leather-diary', 'leather-table-planners',
    'planner-diary', 'sunday-full-page-diary', 'premium-diary', 'diary-with-power-bank',
    'pu-leather-diary', 'number-lock-diary', 'diary-with-pen-gift-set', 'normal-dairy',
    'best-sellers-1', 'eco-friendly-memo-pad', 'customized-note-books', 'notebook-with-pen',
    'personalized-notebooks', 'pu-leather-planners', 'leather-planners', 'latest-products-1'
  ],
  Planners: [
    'leather-planners', 'pu-leather-planners', 'planner-diary', 'latest-products-1'
  ],
  'Corporate Gifts': [
    'business-gifts', 'give-away-gifts', 'water-bottles', 'corporate-gift-sets',
    '2-in-1-gift-sets', '3-in-1-gift-sets', '4-in-1-gift-sets', 'bottles-gift-sets',
    'diary-with-pen-gift-set', 'employee-joining-kit', 'latest-product', 'promotional-gifts'
  ],
  'Leather Gifts': [
    'leather-gifts', 'certificate-folders', 'cheque-book-holders', 'laptop-bags',
    'leather-wallets', 'leather-planners', 'pu-leather-diary', 'leather-diary'
  ],
  'Promotional Gifts': [
    'promotional-gifts', 'card-holder', 'carry-bags', 'coffee-mug', 'key-chains',
    'mouse-pad', 'pen-stand', 'promotional-pens', 'metal-pens', 'plastic-pens',
    'promotional-umbrella', 't-shirts-printing'
  ],
  Calendars: [
    'calendars', 'table-calendar'
  ]
};

const CATEGORIES_TO_INSERT = [
  { slug: 'normal-dairy', title: 'Normal Dairy', group: 'Diaries' },
  { slug: 'best-sellers-1', title: 'Best Sellers', group: 'Diaries' },
  { slug: 'business-gifts', title: 'Business Gifts', group: 'Corporate Gifts' },
  { slug: 'eco-friendly-memo-pad', title: 'Eco Friendly Memo Pad', group: 'Diaries' },
  { slug: 'give-away-gifts', title: 'Give Away Gifts', group: 'Corporate Gifts' },
  { slug: 'water-bottles', title: 'Water Bottles', group: 'Corporate Gifts' },
  { slug: 'calendars', title: 'Calendars', group: 'Calendars' },
  { slug: 'table-calendar', title: 'Table Calendar', group: 'Calendars' },
  { slug: 'corporate-gift-sets', title: 'Corporate Gift Sets', group: 'Corporate Gifts' },
  { slug: '2-in-1-gift-sets', title: '2 in 1 Gift Sets', group: 'Corporate Gifts' },
  { slug: '3-in-1-gift-sets', title: '3 in 1 Gift Sets', group: 'Corporate Gifts' },
  { slug: '4-in-1-gift-sets', title: '4 in 1 Gift Sets', group: 'Corporate Gifts' },
  { slug: 'bottles-gift-sets', title: 'Bottles Gift Sets', group: 'Corporate Gifts' },
  { slug: 'diary-with-pen-gift-set', title: 'Diary With Pen Gift Set', group: 'Diaries' },
  { slug: 'employee-joining-kit', title: 'Employee Joining Kit', group: 'Corporate Gifts' },
  { slug: 'customized-note-books', title: 'Customized Note Books', group: 'Diaries' },
  { slug: 'notebook-with-pen', title: 'Notebook With Pen', group: 'Diaries' },
  { slug: 'personalized-notebooks', title: 'Personalized Notebooks', group: 'Diaries' },
  { slug: 'latest-product', title: 'Latest Product', group: 'Corporate Gifts' },
  { slug: 'latest-products-1', title: 'Latest Products', group: 'Diaries' },
  { slug: 'leather-gifts', title: 'Leather Gifts', group: 'Leather Gifts' },
  { slug: 'certificate-folders', title: 'Certificate Folders', group: 'Leather Gifts' },
  { slug: 'cheque-book-holders', title: 'Cheque Book Holders', group: 'Leather Gifts' },
  { slug: 'laptop-bags', title: 'Laptop Bags', group: 'Leather Gifts' },
  { slug: 'leather-wallets', title: 'Leather Wallets', group: 'Leather Gifts' },
  { slug: 'leather-planners', title: 'Leather Planners', group: 'Planners' },
  { slug: 'new-year-diary', title: 'New Year Diary', group: 'Diaries' },
  { slug: 'latest-diary-collection', title: 'Latest Diary Collection', group: 'Diaries' },
  { slug: 'art-cover-diary', title: 'Art Cover Diary', group: 'Diaries' },
  { slug: 'diary-with-pen', title: 'Diary With Pen', group: 'Diaries' },
  { slug: 'corporate-diary', title: 'Corporate Diary', group: 'Diaries' },
  { slug: 'customized-diary', title: 'Customized Diary', group: 'Diaries' },
  { slug: 'doctor-diary', title: 'Doctor Diary', group: 'Diaries' },
  { slug: 'engineering-diary', title: 'Engineering Diary', group: 'Diaries' },
  { slug: 'executive-diary', title: 'Executive Diary', group: 'Diaries' },
  { slug: 'executive-folder-diary', title: 'Executive Folder Diary', group: 'Diaries' },
  { slug: 'leather-diary', title: 'Leather Diary', group: 'Diaries' },
  { slug: 'leather-table-planners', title: 'Leather Table Planners', group: 'Diaries' },
  { slug: 'planner-diary', title: 'Planner Diary', group: 'Planners' },
  { slug: 'sunday-full-page-diary', title: 'Sunday Full Page Diary', group: 'Diaries' },
  { slug: 'premium-diary', title: 'Premium Diary', group: 'Diaries' },
  { slug: 'diary-with-power-bank', title: 'Diary With Power Bank', group: 'Diaries' },
  { slug: 'pu-leather-planners', title: 'PU Leather Planners', group: 'Planners' },
  { slug: 'number-lock-diary', title: 'Number Lock Diary', group: 'Diaries' },
  { slug: 'pu-leather-diary', title: 'PU Leather Diary', group: 'Diaries' },
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
    title: cat.title,
    group_name: cat.group,
    sort_order: index + 1
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