-- product_id was INTEGER but products.id is UUID; inserts were failing silently
-- so order_items stayed empty → "Item details unavailable" on success page.
ALTER TABLE order_items
  ALTER COLUMN product_id TYPE TEXT USING product_id::text;
