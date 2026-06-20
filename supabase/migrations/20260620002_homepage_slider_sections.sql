-- Homepage slider sections: each row is a "slider" on the homepage with
-- its own title, "View All" link, background color, and a list of up to
-- 10 hand-picked products in display order.

CREATE TABLE IF NOT EXISTS homepage_slider_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,                  -- e.g. 'leather_diary_2026'
  title TEXT NOT NULL,
  view_all_link TEXT,                        -- where "View All →" goes
  bg_color TEXT DEFAULT '#FAF8F5',
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS homepage_slider_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES homepage_slider_sections(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (section_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_slider_items_section ON homepage_slider_items(section_id, position);

-- Seed the 5 sections matching the current homepage layout
INSERT INTO homepage_slider_sections (key, title, view_all_link, bg_color, sort_order) VALUES
  ('leather_diary_2026',   'Leather Diary 2026',         '/shop?cat=leather-diaries',  '#FAF8F5', 1),
  ('combo_gifts',          'Latest Combo Gift Sets',     '/shop?cat=diary-with-pen-gift-set', '#ffffff', 2),
  ('trending',             'Trending items',             '/shop',                      '#FAF8F5', 3),
  ('best_selling_2026',    'Best Selling 2026 Diary',    '/shop',                      '#ffffff', 4),
  ('premium_diary_2026',   'Premium diary 2026',         '/shop?cat=premium-diary',    '#FAF8F5', 5);

ALTER TABLE homepage_slider_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_slider_items ENABLE ROW LEVEL SECURITY;

-- homepage_slider_sections policies
DROP POLICY IF EXISTS "Public read slider_sections" ON homepage_slider_sections;
CREATE POLICY "Public read slider_sections"
  ON homepage_slider_sections FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow insert slider_sections" ON homepage_slider_sections;
CREATE POLICY "Allow insert slider_sections"
  ON homepage_slider_sections FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update slider_sections" ON homepage_slider_sections;
CREATE POLICY "Allow update slider_sections"
  ON homepage_slider_sections FOR UPDATE TO anon USING (true);

DROP POLICY IF EXISTS "Allow delete slider_sections" ON homepage_slider_sections;
CREATE POLICY "Allow delete slider_sections"
  ON homepage_slider_sections FOR DELETE TO anon USING (true);

-- homepage_slider_items policies
DROP POLICY IF EXISTS "Public read slider_items" ON homepage_slider_items;
CREATE POLICY "Public read slider_items"
  ON homepage_slider_items FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow insert slider_items" ON homepage_slider_items;
CREATE POLICY "Allow insert slider_items"
  ON homepage_slider_items FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update slider_items" ON homepage_slider_items;
CREATE POLICY "Allow update slider_items"
  ON homepage_slider_items FOR UPDATE TO anon USING (true);

DROP POLICY IF EXISTS "Allow delete slider_items" ON homepage_slider_items;
CREATE POLICY "Allow delete slider_items"
  ON homepage_slider_items FOR DELETE TO anon USING (true);
