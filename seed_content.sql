INSERT INTO homepage_sections (section_key, title, subtitle, cta_text, cta_link, second_cta_text, second_cta_link, sort_order, active) VALUES
  ('hero', 'Premium Leather Diaries & Corporate Gifts', 'Crafted in India Since 1998', 'Request a Bulk Quote', '/bulk-quote', 'Contact Sales Team', '/contact', 0, true),
  ('cta', 'Ready for Corporate Orders?', 'Get manufacturer-direct pricing on bulk orders of 25+ units. Custom branding with debossing, foil stamping, and bespoke packaging.', 'Request a Bulk Quote', '/bulk-quote', 'Contact Sales Team', '/contact', 1, true)
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO shop_categories (title, image_url, link, sort_order) VALUES
  ('A to Z Diaries', '/images/categories/note-book-diary.jpg', '/shop?cat=diaries', 1),
  ('Corporate Gift Sets', '/images/categories/Corporate-Gift-Set.jpg', '/shop?cat=corporate', 2),
  ('Leather Gifts', '/images/categories/leather-gift.jpg', '/shop?cat=leather-gifts', 3),
  ('Table Calendars', '/images/categories/Table-Calendars.jpg', '/shop?cat=calendars', 4),
  ('Bottle Gift Sets', '/images/categories/Bottle-gift-sets.jpg', '/shop?cat=bottle-sets', 5),
  ('Diary With Pen', '/images/categories/dairy-with-pen.jpg', '/shop?cat=diaries', 6),
  ('Give Away Gifts', '/images/categories/give-away-gifts.jpg', '/shop?cat=corporate', 7)
ON CONFLICT DO NOTHING;

INSERT INTO site_content (section, key, value) VALUES
  ('header', 'announcement_text', 'Manufacturer Direct Pricing | Nationwide Delivery | Request a Bulk Quote'),
  ('header', 'announcement_link', '/bulk-quote'),
  ('footer', 'tagline', 'Premium Diaries, Planners & Corporate Stationery. Crafted in India since 1998.'),
  ('footer', 'address', '174 D, Bawana Industrial Area, Delhi 110039, INDIA'),
  ('footer', 'phone', '+91 9311135190'),
  ('footer', 'phone2', '011-41718999'),
  ('footer', 'email', 'support@newyeardiaries.in'),
  ('footer', 'hours', 'Open time: 10:30AM - 8:00PM'),
  ('footer', 'copyright', '© 2026 New Year Diaries. All Rights Reserved.'),
  ('footer', 'facebook_url', 'https://facebook.com'),
  ('footer', 'instagram_url', 'https://instagram.com'),
  ('footer', 'twitter_url', 'https://twitter.com'),
  ('footer', 'youtube_url', 'https://youtube.com')
ON CONFLICT (section, key) DO NOTHING;
