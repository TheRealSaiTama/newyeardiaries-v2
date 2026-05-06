-- Categories Table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true
);

-- Products Table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tagline TEXT,
  material TEXT,
  size TEXT,
  pages INTEGER,
  price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  sku TEXT UNIQUE,
  badge TEXT,
  short_description TEXT,
  description TEXT,
  features TEXT[],
  colors JSONB DEFAULT '[]',
  images TEXT[],
  min_bulk_order INTEGER DEFAULT 1,
  in_stock BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true
);

-- Banners Table
CREATE TABLE banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT,
  subtitle TEXT,
  cta_text TEXT,
  cta_link TEXT,
  image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  order_index INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
);

-- Site Settings Table (key-value store)
CREATE TABLE site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Public read policies (everyone can read)
CREATE POLICY "Public read categories" ON categories FOR SELECT TO anon USING (true);
CREATE POLICY "Public read products" ON products FOR SELECT TO anon USING (active = true);
CREATE POLICY "Public read banners" ON banners FOR SELECT TO anon USING (active = true);
CREATE POLICY "Public read site_settings" ON site_settings FOR SELECT TO anon USING (true);

-- Admin write policies (authenticated users can write)
CREATE POLICY "Admin insert categories" ON categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin update categories" ON categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin delete categories" ON categories FOR DELETE TO authenticated USING (true);

CREATE POLICY "Admin insert products" ON products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin update products" ON products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin delete products" ON products FOR DELETE TO authenticated USING (true);

CREATE POLICY "Admin insert banners" ON banners FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin update banners" ON banners FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin delete banners" ON banners FOR DELETE TO authenticated USING (true);

CREATE POLICY "Admin insert site_settings" ON site_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin update site_settings" ON site_settings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin delete site_settings" ON site_settings FOR DELETE TO authenticated USING (true);

-- Seed default site settings
INSERT INTO site_settings (key, value, description) VALUES
  ('site_name', 'New Year Diaries', 'Website name'),
  ('tagline', 'Premium Diaries, Planners & Corporate Stationery. Crafted in India since 1998.', 'Site tagline'),
  ('contact_email', 'support@newyeardiaries.in', 'Contact email'),
  ('contact_phone', '+91 9311135190', 'Contact phone'),
  ('contact_address', '174 D, Bawana Industrial Area, Delhi 110039, INDIA', 'Business address'),
  ('footer_copyright', '© 2026 New Year Diaries. All Rights Reserved.', 'Footer copyright text');
