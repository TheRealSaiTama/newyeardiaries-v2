-- Trust badges: editable list of USP badges shown on the homepage above
-- the "Ready for Corporate Orders?" CTA. Position is the display order.

CREATE TABLE IF NOT EXISTS trust_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  icon TEXT NOT NULL,             -- material symbols name (e.g. 'draw', 'factory')
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER DEFAULT 0,     -- display order
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trust_badges_position ON trust_badges(position);

-- Seed with the four default badges matching the current hardcoded values
INSERT INTO trust_badges (icon, title, description, position) VALUES
  ('draw',                'Customized Diaries',    'Your Brand Logo Embossed',       1),
  ('factory',             'Direct Manufacturer',  'Unbeatable Wholesale Prices',    2),
  ('workspace_premium',   'Premium Quality',       'Imported PU & FSC Paper',        3),
  ('local_shipping',      'Pan India Delivery',    'Fast & Insured Shipping',        4);

ALTER TABLE trust_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read trust_badges" ON trust_badges;
CREATE POLICY "Public read trust_badges"
  ON trust_badges FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow insert trust_badges" ON trust_badges;
CREATE POLICY "Allow insert trust_badges"
  ON trust_badges FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update trust_badges" ON trust_badges;
CREATE POLICY "Allow update trust_badges"
  ON trust_badges FOR UPDATE TO anon USING (true);

DROP POLICY IF EXISTS "Allow delete trust_badges" ON trust_badges;
CREATE POLICY "Allow delete trust_badges"
  ON trust_badges FOR DELETE TO anon USING (true);
