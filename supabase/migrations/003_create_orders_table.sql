-- Orders Table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  order_number TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company TEXT,
  gst TEXT,
  country TEXT DEFAULT 'India',
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postcode TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  special_instructions TEXT,
  payment_method TEXT NOT NULL,
  privacy_agreed BOOLEAN DEFAULT false,
  subtotal NUMERIC(12,2) NOT NULL,
  gst_amount NUMERIC(12,2) NOT NULL,
  shipping NUMERIC(12,2) NOT NULL,
  total NUMERIC(12,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'))
);

-- Order Items Table
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER,
  product_name TEXT NOT NULL,
  product_image TEXT,
  material TEXT,
  size TEXT,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  line_total NUMERIC(12,2) NOT NULL
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Public insert policies (for checkout)
CREATE POLICY "Allow public insert orders" ON orders FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public insert order_items" ON order_items FOR INSERT TO anon WITH CHECK (true);

-- Admin read policies
CREATE POLICY "Admin read orders" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin read order_items" ON order_items FOR SELECT TO authenticated USING (true);
