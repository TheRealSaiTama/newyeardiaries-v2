-- Product highlights (shipping badge + warranty badge) as checkboxes
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_shipping_badge BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_warranty_badge BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT DEFAULT '';

-- Reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  verified_purchase BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true
);

-- RLS for product_reviews
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read product_reviews" ON product_reviews FOR SELECT TO anon USING (active = true);
CREATE POLICY "Public insert product_reviews" ON product_reviews FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow update product_reviews" ON product_reviews FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow delete product_reviews" ON product_reviews FOR DELETE TO anon USING (true);

-- Update existing products to set default badges
UPDATE products SET has_shipping_badge = false, has_warranty_badge = false, tags = '' WHERE has_shipping_badge IS NULL;