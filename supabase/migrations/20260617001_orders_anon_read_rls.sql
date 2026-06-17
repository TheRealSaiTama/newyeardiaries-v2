-- Fix: admin panel could not read orders / order_items.
-- The admin "auth" on this site is client-side sessionStorage (NOT real
-- Supabase auth), so requests run as the anon role. The original RLS
-- granted SELECT only TO authenticated, which blocked the admin reads.
-- Allow anon SELECT so the admin panel (using the anon key) can list orders.

-- Orders: anon can read (admin dashboard) + update status (admin actions)
DROP POLICY IF EXISTS "Allow public read orders" ON orders;
DROP POLICY IF EXISTS "Allow public update orders" ON orders;
CREATE POLICY "Allow public read orders" ON orders FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public update orders" ON orders FOR UPDATE TO anon USING (true);

-- Order items: anon can read
DROP POLICY IF EXISTS "Allow public read order_items" ON order_items;
CREATE POLICY "Allow public read order_items" ON order_items FOR SELECT TO anon USING (true);
