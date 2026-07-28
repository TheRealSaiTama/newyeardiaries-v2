-- Migration: Fix RLS Policy for shop_categories table to allow Admin Panel writes
ALTER TABLE IF EXISTS shop_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read shop_categories" ON shop_categories;
CREATE POLICY "Allow public read shop_categories" ON shop_categories
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow admin write shop_categories" ON shop_categories;
CREATE POLICY "Allow admin write shop_categories" ON shop_categories
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
