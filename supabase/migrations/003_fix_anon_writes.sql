-- Fix anonymous write access for admin operations
-- Admin auth is handled client-side via password (sessionStorage), not Supabase Auth.
-- All RLS write policies must use TO anon instead of TO authenticated.

-- Products
DROP POLICY IF EXISTS "Admin insert products" ON products;
DROP POLICY IF EXISTS "Admin update products" ON products;
DROP POLICY IF EXISTS "Admin delete products" ON products;
CREATE POLICY "Allow insert products" ON products FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow update products" ON products FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow delete products" ON products FOR DELETE TO anon USING (true);

-- Categories
DROP POLICY IF EXISTS "Admin insert categories" ON categories;
DROP POLICY IF EXISTS "Admin update categories" ON categories;
DROP POLICY IF EXISTS "Admin delete categories" ON categories;
CREATE POLICY "Allow insert categories" ON categories FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow update categories" ON categories FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow delete categories" ON categories FOR DELETE TO anon USING (true);

-- Banners
DROP POLICY IF EXISTS "Admin insert banners" ON banners;
DROP POLICY IF EXISTS "Admin update banners" ON banners;
DROP POLICY IF EXISTS "Admin delete banners" ON banners;
CREATE POLICY "Allow insert banners" ON banners FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow update banners" ON banners FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow delete banners" ON banners FOR DELETE TO anon USING (true);

-- Site Settings
DROP POLICY IF EXISTS "Admin insert site_settings" ON site_settings;
DROP POLICY IF EXISTS "Admin update site_settings" ON site_settings;
DROP POLICY IF EXISTS "Admin delete site_settings" ON site_settings;
CREATE POLICY "Allow insert site_settings" ON site_settings FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow update site_settings" ON site_settings FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow delete site_settings" ON site_settings FOR DELETE TO anon USING (true);
