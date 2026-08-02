-- RLS Hardening: tighten admin RLS to require authenticated role
-- (Kills CRITICAL C3, C5 — anon can no longer SELECT/UPDATE orders or enquiry tables)
--
-- Public-facing SELECT still works (customers can browse products, see banners, etc.)
-- Public-facing INSERT still works (customers can place orders, submit contact/quote forms)
-- Admin operations (UPDATE, DELETE, INSERT on admin tables) now require authenticated role
-- Admin reads of orders + enquiry tables now require authenticated role

-- 1. Drop dangerous "admin write" policies that allow anon
DROP POLICY IF EXISTS "Allow admin write shop_categories" ON shop_categories;
DROP POLICY IF EXISTS "Allow admin write category_groups" ON category_groups;
DROP POLICY IF EXISTS "Allow admin write categories" ON categories;
DROP POLICY IF EXISTS "Allow admin write products" ON products;
DROP POLICY IF EXISTS "Allow admin write product_categories" ON product_categories;
DROP POLICY IF EXISTS "Allow admin write banners" ON banners;
DROP POLICY IF EXISTS "Allow admin write homepage_sections" ON homepage_sections;
DROP POLICY IF EXISTS "Allow admin write site_content" ON site_content;
DROP POLICY IF EXISTS "Allow admin write site_settings" ON site_settings;
DROP POLICY IF EXISTS "Allow admin write announcements" ON announcements;
DROP POLICY IF EXISTS "Allow admin write trust_badges" ON trust_badges;

-- 2. Drop dangerous orders policies (C3: anon can SELECT + UPDATE orders)
DROP POLICY IF EXISTS "Allow public read orders" ON orders;
DROP POLICY IF EXISTS "Allow public update orders" ON orders;
DROP POLICY IF EXISTS "Allow admin all orders" ON orders;
DROP POLICY IF EXISTS "Allow admin update orders" ON orders;
DROP POLICY IF EXISTS "Allow anon update orders" ON orders;
DROP POLICY IF EXISTS "Allow anon select orders" ON orders;

-- 3. Drop dangerous enquiry SELECT policies (C5: anon can read customer enquiries)
DROP POLICY IF EXISTS "Admin read contact_submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Admin read quote_requests" ON quote_requests;
DROP POLICY IF EXISTS "Admin read enquiries" ON enquiries;
DROP POLICY IF EXISTS "Allow anon select contact_submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Allow anon select quote_requests" ON quote_requests;
DROP POLICY IF EXISTS "Allow anon select enquiries" ON enquiries;

-- 4. Create proper admin policies: TO authenticated only
CREATE POLICY "Admin all shop_categories" ON shop_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all category_groups" ON category_groups FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all products" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all product_categories" ON product_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all banners" ON banners FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all homepage_sections" ON homepage_sections FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all site_content" ON site_content FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all site_settings" ON site_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all announcements" ON announcements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all trust_badges" ON trust_badges FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Admin operations on orders (C3 fix)
CREATE POLICY "Admin all orders" ON orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Admin can read all enquiry submissions (C5 fix)
CREATE POLICY "Admin all contact_submissions" ON contact_submissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all quote_requests" ON quote_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all enquiries" ON enquiries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Ensure public INSERT still works on forms (customers can place orders, submit forms)
-- These may have been dropped above; recreate if needed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public inserts contact_submissions' AND tablename = 'contact_submissions') THEN
    CREATE POLICY "Allow public inserts contact_submissions" ON contact_submissions FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public inserts quote_requests' AND tablename = 'quote_requests') THEN
    CREATE POLICY "Allow public inserts quote_requests" ON quote_requests FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public inserts enquiries' AND tablename = 'enquiries') THEN
    CREATE POLICY "Allow public inserts enquiries" ON enquiries FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public inserts orders' AND tablename = 'orders') THEN
    CREATE POLICY "Allow public inserts orders" ON orders FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public inserts order_items' AND tablename = 'order_items') THEN
    CREATE POLICY "Allow public inserts order_items" ON order_items FOR INSERT TO anon WITH CHECK (true);
  END IF;
END $$;

-- 6. Ensure order_items RLS allows admin to read (if not already)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items') THEN
    ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
  END IF;
  -- Drop any old "Allow public" order_items policies
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS "' || policyname || '" ON order_items;', E'\n')
    FROM pg_policies WHERE tablename = 'order_items' AND policyname ILIKE '%public%'
  );
  -- Admin all on order_items
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin all order_items' AND tablename = 'order_items') THEN
    CREATE POLICY "Admin all order_items" ON order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
