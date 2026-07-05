-- Fix anonymous write access for category_groups (allowing admin operations to work via anon key)
DROP POLICY IF EXISTS "Allow admin write category_groups" ON category_groups;
CREATE POLICY "Allow admin write category_groups" ON category_groups
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
