-- Fix RLS for product_categories junction table (multi-category support in admin)
-- The 005_product_categories_junction.sql created the policies, but like the enquiry tables,
-- they appear to have been dropped on the live DB.
-- Admin product save does DELETE + INSERT into this table (as anon client).
-- Without these, multi-category selection "saves" (legacy category_id gets first one)
-- but the junction rows are missing → edit modal shows no checkboxes pre-filled,
-- and the products table only shows the single legacy category.

DROP POLICY IF EXISTS "Public read product_categories" ON product_categories;
CREATE POLICY "Public read product_categories" ON product_categories FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow insert product_categories" ON product_categories;
CREATE POLICY "Allow insert product_categories" ON product_categories FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete product_categories" ON product_categories;
CREATE POLICY "Allow delete product_categories" ON product_categories FOR DELETE TO anon USING (true);
