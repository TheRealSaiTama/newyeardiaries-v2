-- Per-category sort order for products. Each (product, category) junction row
-- now carries its own sort_order (1..100), so the same product can appear
-- at different positions in different categories. Replaces the single
-- products.sort_order value as the canonical ordering for category pages.

ALTER TABLE product_categories
  ADD COLUMN IF NOT EXISTS sort_order SMALLINT
    CHECK (sort_order IS NULL OR (sort_order BETWEEN 1 AND 100));

CREATE INDEX IF NOT EXISTS idx_pc_category_sort
  ON product_categories(category_id, sort_order);

-- Backfill from the legacy products.sort_order: only seed rows where
-- the junction product is the product's PRIMARY category (category_id
-- matches products.category_id), so the existing order is preserved.
UPDATE product_categories pc
SET sort_order = GREATEST(1, LEAST(100, p.sort_order))
FROM products p
WHERE pc.product_id = p.id
  AND pc.category_id = p.category_id
  AND pc.sort_order IS NULL
  AND p.sort_order IS NOT NULL
  AND p.sort_order > 0;
