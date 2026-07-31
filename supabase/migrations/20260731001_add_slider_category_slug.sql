-- Add category_slug to homepage_slider_sections so slider rows can be
-- auto-populated from a category instead of a static product list.
-- When category_slug is set, the frontend filters allProducts by this
-- category slug and takes the top 10. When NULL, the existing static
-- homepage_slider_items.product_id list is used (manual picker).
--
-- Backfill: seed the 5 default sections with the category slugs they
-- originally targeted before the slider was made DB-driven.

ALTER TABLE homepage_slider_sections
  ADD COLUMN IF NOT EXISTS category_slug TEXT;

UPDATE homepage_slider_sections SET category_slug = 'leather-diaries'         WHERE key = 'leather_diary_2026'  AND category_slug IS NULL;
UPDATE homepage_slider_sections SET category_slug = 'diary-with-pen-gift-set' WHERE key = 'combo_gifts'         AND category_slug IS NULL;
UPDATE homepage_slider_sections SET category_slug = 'premium-diary'          WHERE key = 'premium_diary_2026' AND category_slug IS NULL;
-- 'trending' and 'best_selling_2026' have no natural category; leave NULL so
-- they fall back to the manually-picked product list.
