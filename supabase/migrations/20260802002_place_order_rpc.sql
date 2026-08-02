-- H2.1 + H2.3: Atomic order placement with server-side price/tax computation.
-- Client may only send product_id + quantity; unit prices come from products table.
-- Anon can EXECUTE (checkout); function runs as definer so RLS insert policies still apply
-- via the function owner (postgres/supabase_admin) path.

CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1000;

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

  -- Server-side price lookup (never trust client unit prices)
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

    IF v_qty < COALESCE(v_product.min_bulk_order, 1) THEN
      RAISE EXCEPTION 'quantity below MOQ (%) for product %',
        COALESCE(v_product.min_bulk_order, 1), v_product.name;
    END IF;

    v_unit := COALESCE(v_product.price, 0);
    v_line := round(v_unit * v_qty, 2);
    v_subtotal := v_subtotal + v_line;
  END LOOP;

  v_gst_amount := round(v_subtotal * 0.18, 2);
  -- Shipping left at 0 (calculated later offline); matches current storefront UX
  v_shipping := 0;
  v_total := v_subtotal + v_gst_amount + v_shipping;

  -- M2: sequential order numbers — NYD-YYYYMMDD-#### (no 28h collision)
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
        v_img := NULL; -- never store base64 in order_items
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

COMMENT ON FUNCTION public.place_order IS
  'Atomic checkout: creates orders + order_items with server-side prices (H2.1/H2.3).';
