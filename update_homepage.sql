INSERT INTO homepage_sections (section_key, title, subtitle, cta_text, cta_link, second_cta_text, second_cta_link, sort_order, active) VALUES
  ('hero', 'Premium Leather Diaries & Corporate Gifts', 'Crafted in India Since 1998', 'Request a Bulk Quote', '/bulk-quote', 'Contact Sales Team', '/contact', 0, true),
  ('cta', 'Ready for Corporate Orders?', 'Get manufacturer-direct pricing on bulk orders of 25+ units. Custom branding with debossing, foil stamping, and bespoke packaging.', 'Request a Bulk Quote', '/bulk-quote', 'Contact Sales Team', '/contact', 1, true)
ON CONFLICT (section_key) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  cta_text = EXCLUDED.cta_text,
  cta_link = EXCLUDED.cta_link,
  second_cta_text = EXCLUDED.second_cta_text,
  second_cta_link = EXCLUDED.second_cta_link,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;
