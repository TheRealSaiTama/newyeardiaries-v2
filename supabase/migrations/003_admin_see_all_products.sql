ALTER TABLE products DROP POLICY IF EXISTS "Public read products";
ALTER TABLE products DROP POLICY IF EXISTS "Admin read products";

CREATE POLICY "Public read products" ON products FOR SELECT TO anon USING (true);
