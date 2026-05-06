import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf8');
const anonMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);
if (!anonMatch) {
  console.error('Could not find anon key');
  process.exit(1);
}
const supabaseUrl = 'https://cqrnmyssytgfvgrhhfoz.supabase.co';
const supabaseKey = anonMatch[1].trim();

const supabase = createClient(supabaseUrl, supabaseKey);

const imageBase = 'https://newyeardiaries.in/wp-content/uploads';

const categories = [
  { title: 'Note Book Diary', image_url: `${imageBase}/note-book-diary.jpg`, link: '/shop?category=note-book-diary', sort_order: 1, active: true },
  { title: 'Corporate Gift Sets', image_url: `${imageBase}/Corporate-Gift-Sets-3.jpg`, link: '/shop?category=corporate-gift-sets', sort_order: 2, active: true },
  { title: 'Employee Joining Kit', image_url: `${imageBase}/Best-New-Year-Diary-1.jpg`, link: '/shop?category=employee-joining-kit', sort_order: 3, active: true },
  { title: 'Bottles Gift Sets', image_url: `${imageBase}/Bottle-gift-sets.jpg`, link: '/shop?category=bottles-gift-sets', sort_order: 4, active: true },
  { title: 'Diary with Pen', image_url: `${imageBase}/dairy-with-pen.jpg`, link: '/shop?category=diary-with-pen', sort_order: 5, active: true },
  { title: 'Give Away Gifts', image_url: `${imageBase}/give-away-gifts.jpg`, link: '/shop?category=give-away-gifts', sort_order: 6, active: true },
  { title: 'Leather Gifts', image_url: `${imageBase}/leather-gift.jpg`, link: '/shop?category=leather-gifts', sort_order: 7, active: true },
  { title: 'Table Calendars', image_url: `${imageBase}/Table-Calendars.jpg`, link: '/shop?category=table-calendars', sort_order: 8, active: true },
];

const heroSection = {
  section_key: 'hero',
  title: 'Premium Leather Diaries & Corporate Gifts',
  subtitle: 'Crafted in India Since 1998',
  cta_text: 'Request a Bulk Quote',
  cta_link: '/bulk-quote',
  second_cta_text: 'Contact Sales Team',
  second_cta_link: '/contact',
  sort_order: 0,
  active: true,
};

const ctaSection = {
  section_key: 'cta',
  title: 'Ready for Corporate Orders?',
  subtitle: 'Get manufacturer-direct pricing on bulk orders of 25+ units. Custom branding with debossing, foil stamping, and bespoke packaging.',
  cta_text: 'Request a Bulk Quote',
  cta_link: '/bulk-quote',
  second_cta_text: 'Contact Sales Team',
  second_cta_link: '/contact',
  sort_order: 1,
  active: true,
};

async function updateDatabase() {
  console.log('Clearing existing shop_categories...');
  await supabase.from('shop_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('Inserting 8 categories...');
  const { error: insertError } = await supabase.from('shop_categories').insert(categories);
  if (insertError) {
    console.error('Error inserting categories:', insertError.message);
    process.exit(1);
  }
  console.log('Categories inserted successfully!');

  console.log('Upserting hero section...');
  const { error: heroError } = await supabase
    .from('homepage_sections')
    .upsert(heroSection, { onConflict: 'section_key' });
  if (heroError) {
    console.error('Error updating hero section:', heroError.message);
    process.exit(1);
  }
  console.log('Hero section updated!');

  console.log('Upserting CTA section...');
  const { error: ctaError } = await supabase
    .from('homepage_sections')
    .upsert(ctaSection, { onConflict: 'section_key' });
  if (ctaError) {
    console.error('Error updating CTA section:', ctaError.message);
    process.exit(1);
  }
  console.log('CTA section updated!');

  const { data: cats } = await supabase.from('shop_categories').select('*').order('sort_order');
  console.log('\nCategories in DB:');
  cats?.forEach(c => console.log(`  ${c.sort_order}. ${c.title} - ${c.image_url}`));

  const { data: heroes } = await supabase.from('homepage_sections').select('*');
  console.log('\nHomepage sections:');
  heroes?.forEach(h => console.log(`  ${h.section_key}: ${h.title}`));

  process.exit(0);
}

updateDatabase().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
