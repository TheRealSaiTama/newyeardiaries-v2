ALTER TABLE orders ADD COLUMN IF NOT EXISTS customisation TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS additional_info TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS logo_images JSONB DEFAULT '[]'::jsonb;

DROP POLICY IF EXISTS "Allow public insert orders" ON orders;
DROP POLICY IF EXISTS "Allow public inserts orders" ON orders;
CREATE POLICY "Allow public insert orders" ON orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public insert order_items" ON order_items;
DROP POLICY IF EXISTS "Allow public inserts order_items" ON order_items;
CREATE POLICY "Allow public insert order_items" ON order_items
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon select own order after insert" ON orders;
CREATE POLICY "Allow anon select own order after insert" ON orders
  FOR SELECT TO anon
  USING (created_at > now() - interval '2 minutes');

DROP POLICY IF EXISTS "Allow anon select order_items after insert" ON order_items;
CREATE POLICY "Allow anon select order_items after insert" ON order_items
  FOR SELECT TO anon
  USING (created_at > now() - interval '2 minutes');

CREATE OR REPLACE FUNCTION public.place_order(
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_address_line_1 text,
  p_city text,
  p_state text,
  p_postcode text,
  p_items jsonb,
  p_company text DEFAULT NULL,
  p_gst text DEFAULT NULL,
  p_address_line_2 text DEFAULT NULL,
  p_country text DEFAULT 'India',
  p_special_instructions text DEFAULT NULL,
  p_customisation text DEFAULT NULL,
  p_additional_info text DEFAULT NULL,
  p_logo_images jsonb DEFAULT '[]'::jsonb,
  p_payment_method text DEFAULT 'bank',
  p_privacy_agreed boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric(12,2) := 0;
  v_gst_amount numeric(12,2) := 0;
  v_shipping numeric(12,2) := 0;
  v_total numeric(12,2) := 0;
  v_item jsonb;
  v_product products%ROWTYPE;
  v_qty integer;
  v_unit numeric(12,2);
  v_line numeric(12,2);
  v_seq bigint;
  v_img text;
  v_moq integer;
BEGIN
  IF p_first_name IS NULL OR length(trim(p_first_name)) = 0 THEN
    RAISE EXCEPTION 'first_name is required';
  END IF;
  IF p_last_name IS NULL OR length(trim(p_last_name)) = 0 THEN
    RAISE EXCEPTION 'last_name is required';
  END IF;
  IF p_email IS NULL OR length(trim(p_email)) = 0 THEN
    RAISE EXCEPTION 'email is required';
  END IF;
  IF p_phone IS NULL OR length(trim(p_phone)) = 0 THEN
    RAISE EXCEPTION 'phone is required';
  END IF;
  IF p_address_line_1 IS NULL OR length(trim(p_address_line_1)) = 0 THEN
    RAISE EXCEPTION 'address is required';
  END IF;
  IF p_city IS NULL OR length(trim(p_city)) = 0 THEN
    RAISE EXCEPTION 'city is required';
  END IF;
  IF p_state IS NULL OR length(trim(p_state)) = 0 THEN
    RAISE EXCEPTION 'state is required';
  END IF;
  IF p_postcode IS NULL OR length(trim(p_postcode)) = 0 THEN
    RAISE EXCEPTION 'postcode is required';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'items array is required';
  END IF;
  IF jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'too many items';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := COALESCE((v_item->>'quantity')::integer, (v_item->>'qty')::integer, 0);
    IF v_qty IS NULL OR v_qty < 1 THEN
      RAISE EXCEPTION 'invalid quantity for product %', v_item->>'product_id';
    END IF;
    IF v_qty > 100000 THEN
      RAISE EXCEPTION 'quantity too large for product %', v_item->>'product_id';
    END IF;

    SELECT * INTO v_product
    FROM products
    WHERE id::text = (v_item->>'product_id')
      AND active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'product not found or inactive: %', v_item->>'product_id';
    END IF;

    IF v_product.in_stock = false THEN
      RAISE EXCEPTION 'product out of stock: %', v_product.name;
    END IF;

    v_moq := COALESCE(v_product.min_bulk_order, 1);
    IF v_moq < 1 THEN v_moq := 1; END IF;
    IF v_qty < v_moq THEN
      RAISE EXCEPTION 'quantity below MOQ (%) for product %', v_moq, v_product.name;
    END IF;

    v_unit := COALESCE(v_product.price, 0);
    v_line := round(v_unit * v_qty, 2);
    v_subtotal := v_subtotal + v_line;
  END LOOP;

  v_gst_amount := round(v_subtotal * 0.18, 2);
  v_shipping := 0;
  v_total := v_subtotal + v_gst_amount + v_shipping;

  v_seq := nextval('order_number_seq');
  v_order_number := 'NYD-' || to_char(timezone('Asia/Kolkata', now()), 'YYYYMMDD') || '-' || lpad((v_seq % 10000)::text, 4, '0');

  INSERT INTO orders (
    order_number, first_name, last_name, company, gst, country,
    address_line_1, address_line_2, city, state, postcode, phone, email,
    special_instructions, customisation, additional_info, logo_images,
    payment_method, privacy_agreed, subtotal, gst_amount, shipping, total, status
  ) VALUES (
    v_order_number,
    trim(p_first_name), trim(p_last_name), nullif(trim(p_company), ''), nullif(trim(p_gst), ''),
    COALESCE(nullif(trim(p_country), ''), 'India'),
    trim(p_address_line_1), nullif(trim(p_address_line_2), ''),
    trim(p_city), trim(p_state), trim(p_postcode), trim(p_phone), trim(p_email),
    p_special_instructions, p_customisation, p_additional_info,
    COALESCE(p_logo_images, '[]'::jsonb),
    COALESCE(nullif(trim(p_payment_method), ''), 'bank'),
    COALESCE(p_privacy_agreed, true),
    v_subtotal, v_gst_amount, v_shipping, v_total, 'pending'
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := COALESCE((v_item->>'quantity')::integer, (v_item->>'qty')::integer, 0);

    SELECT * INTO v_product
    FROM products
    WHERE id::text = (v_item->>'product_id')
      AND active = true;

    v_unit := COALESCE(v_product.price, 0);
    v_line := round(v_unit * v_qty, 2);
    v_img := NULL;
    IF v_product.images IS NOT NULL AND array_length(v_product.images, 1) >= 1 THEN
      v_img := v_product.images[1];
      IF v_img IS NOT NULL AND v_img LIKE 'data:%' THEN
        v_img := NULL;
      END IF;
    END IF;

    INSERT INTO order_items (
      order_id, product_id, product_name, product_image, material, size,
      quantity, unit_price, line_total
    ) VALUES (
      v_order_id,
      v_product.id::text,
      v_product.name,
      v_img,
      v_product.material,
      v_product.size,
      v_qty,
      v_unit,
      v_line
    );
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'gst_amount', v_gst_amount,
    'shipping', v_shipping,
    'total', v_total
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_order(
  text, text, text, text, text, text, text, text, jsonb,
  text, text, text, text, text, text, text, jsonb, text, boolean
) TO anon, authenticated;
