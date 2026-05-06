-- Insert homepage hero section
INSERT INTO homepage_sections (section_key, title, subtitle, cta_text, cta_link, second_cta_text, second_cta_link, sort_order, active)
VALUES ('hero', 'Premium Leather Diaries & Corporate Gifts', 'Customized with Your Logo | Direct from Manufacturer | Pan India Delivery', 'Shop Now', '/shop', 'Get Bulk Quote', '/bulk-quote', 1, true)
ON CONFLICT (section_key) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  cta_text = EXCLUDED.cta_text,
  cta_link = EXCLUDED.cta_link,
  second_cta_text = EXCLUDED.second_cta_text,
  second_cta_link = EXCLUDED.second_cta_link;

-- Insert shop by category sections
INSERT INTO shop_categories (title, image_url, link, sort_order, active)
VALUES
  ('A to Z Diaries', 'https://newyeardiaries.in/wp-content/uploads/2022/09/note-book-diary.jpg', '/shop?cat=a-to-z-diary-collection', 1, true),
  ('Corporate Gift Sets', 'https://newyeardiaries.in/wp-content/uploads/2022/08/Corporate-Gift-Sets-3.jpg', '/shop?cat=corporate-gift-sets', 2, true),
  ('Employee Joining Kit', 'https://newyeardiaries.in/wp-content/uploads/2022/08/Best-New-Year-Diary-1.jpg', '/shop?cat=employee-joining-kit', 3, true),
  ('Bottles Gift Sets', 'https://newyeardiaries.in/wp-content/uploads/2022/09/Bottle-gift-sets.jpg', '/shop?cat=bottles-gift-sets', 4, true),
  ('Diary with Pen', 'https://newyeardiaries.in/wp-content/uploads/2022/08/dairy-with-pen.jpg', '/shop?cat=diary-with-pen', 5, true),
  ('Give Away Gifts', 'https://newyeardiaries.in/wp-content/uploads/2022/09/give-away-gifts.jpg', '/shop?cat=give-away-gifts', 6, true),
  ('Leather Gifts', 'https://newyeardiaries.in/wp-content/uploads/2022/08/leather-gift.jpg', '/shop?cat=leather-gifts', 7, true),
  ('Table Calendars', 'https://newyeardiaries.in/wp-content/uploads/2022/09/Table-Calendars.jpg', '/shop?cat=table-calendar', 8, true)
ON CONFLICT DO NOTHING;
