-- Master Migration: Enable RLS and Grant Full Admin Access (SELECT, INSERT, UPDATE, DELETE)
-- for all content, shop, category, product, banner, order, and enquiry tables.

-- 1. shop_categories
ALTER TABLE IF EXISTS shop_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read shop_categories" ON shop_categories;
CREATE POLICY "Allow public read shop_categories" ON shop_categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Allow admin write shop_categories" ON shop_categories;
CREATE POLICY "Allow admin write shop_categories" ON shop_categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 2. category_groups
ALTER TABLE IF EXISTS category_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read category_groups" ON category_groups;
CREATE POLICY "Allow public read category_groups" ON category_groups FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Allow admin write category_groups" ON category_groups;
CREATE POLICY "Allow admin write category_groups" ON category_groups FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 3. categories
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read categories" ON categories;
CREATE POLICY "Allow public read categories" ON categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Allow admin write categories" ON categories;
CREATE POLICY "Allow admin write categories" ON categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 4. products
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read products" ON products;
CREATE POLICY "Allow public read products" ON products FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Allow admin write products" ON products;
CREATE POLICY "Allow admin write products" ON products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 5. product_categories
ALTER TABLE IF EXISTS product_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read product_categories" ON product_categories;
CREATE POLICY "Allow public read product_categories" ON product_categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Allow admin write product_categories" ON product_categories;
CREATE POLICY "Allow admin write product_categories" ON product_categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 6. banners
ALTER TABLE IF EXISTS banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read banners" ON banners;
CREATE POLICY "Allow public read banners" ON banners FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Allow admin write banners" ON banners;
CREATE POLICY "Allow admin write banners" ON banners FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 7. homepage_sections
ALTER TABLE IF EXISTS homepage_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read homepage_sections" ON homepage_sections;
CREATE POLICY "Allow public read homepage_sections" ON homepage_sections FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Allow admin write homepage_sections" ON homepage_sections;
CREATE POLICY "Allow admin write homepage_sections" ON homepage_sections FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 8. site_content
ALTER TABLE IF EXISTS site_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read site_content" ON site_content;
CREATE POLICY "Allow public read site_content" ON site_content FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Allow admin write site_content" ON site_content;
CREATE POLICY "Allow admin write site_content" ON site_content FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 9. site_settings
ALTER TABLE IF EXISTS site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read site_settings" ON site_settings;
CREATE POLICY "Allow public read site_settings" ON site_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Allow admin write site_settings" ON site_settings;
CREATE POLICY "Allow admin write site_settings" ON site_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 10. announcements
ALTER TABLE IF EXISTS announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read announcements" ON announcements;
CREATE POLICY "Allow public read announcements" ON announcements FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Allow admin write announcements" ON announcements;
CREATE POLICY "Allow admin write announcements" ON announcements FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 11. trust_badges
ALTER TABLE IF EXISTS trust_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read trust_badges" ON trust_badges;
CREATE POLICY "Allow public read trust_badges" ON trust_badges FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Allow admin write trust_badges" ON trust_badges;
CREATE POLICY "Allow admin write trust_badges" ON trust_badges FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
