-- Junction table for many-to-many product-category relationship
CREATE TABLE product_categories (
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

CREATE INDEX idx_pc_product ON product_categories(product_id);
CREATE INDEX idx_pc_category ON product_categories(category_id);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read product_categories" ON product_categories FOR SELECT TO anon USING (true);
CREATE POLICY "Allow insert product_categories" ON product_categories FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow delete product_categories" ON product_categories FOR DELETE TO anon USING (true);

-- Migrate existing category_id data into junction table
INSERT INTO product_categories (product_id, category_id)
SELECT id, category_id FROM products WHERE category_id IS NOT NULL
ON CONFLICT DO NOTHING;
