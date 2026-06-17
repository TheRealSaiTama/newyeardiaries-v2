-- Category groups: replace the hardcoded CATEGORY_GROUPS map with DB-driven
-- groups so admin changes propagate to the live site on cache refresh.

CREATE TABLE IF NOT EXISTS category_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add nullable group_id to categories (soft link — missing means "Uncategorized")
ALTER TABLE categories ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES category_groups(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_categories_group_id ON categories(group_id);

-- Seed the 8 default groups (idempotent via ON CONFLICT)
INSERT INTO category_groups (name, sort_order) VALUES
  ('Corporate Gift Sets', 1),
  ('Business Gifts', 2),
  ('New Year Diary', 3),
  ('Premium Diary', 4),
  ('Calendars', 5),
  ('Note Books & Pads', 6),
  ('Leather Gifts', 7),
  ('Leather Planners', 8),
  ('Promotional Gifts', 9)
ON CONFLICT (name) DO NOTHING;

-- Assign each existing category to its group (best-effort mapping from
-- the previous hardcoded CATEGORY_GROUPS map). Anything not in the map
-- stays with group_id = NULL and shows up in "Uncategorized".
DO $$
DECLARE
  grp record;
  cat record;
BEGIN
  FOR grp IN SELECT id, name FROM category_groups LOOP
    FOR cat IN
      SELECT c.id FROM categories c
      WHERE c.group_id IS NULL
        AND c.slug IN (
          'corporate-gift-sets', 'bottles-gift-sets', 'diary-with-pen-gift-set',
          'employee-joining-kit', 'latest-product'
        ) AND grp.name = 'Corporate Gift Sets'
      UNION ALL
        SELECT c.id FROM categories c
        WHERE c.group_id IS NULL
          AND c.slug IN (
            'laptop-bags', 'give-away-gifts', 'water-bottles', 'coffee-mug',
            'key-chains', 'promotional-umbrella'
          ) AND grp.name = 'Business Gifts'
      UNION ALL
        SELECT c.id FROM categories c
        WHERE c.group_id IS NULL
          AND c.slug IN (
            'a-to-z-diary-collection', 'sunday-full-page-diary', 'corporate-diary',
            'executive-diary', 'engineering-diary', 'executive-folder-diary',
            'economy-diary', 'plain-diary'
          ) AND grp.name = 'New Year Diary'
      UNION ALL
        SELECT c.id FROM categories c
        WHERE c.group_id IS NULL
          AND c.slug IN (
            'premium-diary', 'leather-diary', 'leather-planner', 'leather-planners'
          ) AND grp.name = 'Premium Diary'
      UNION ALL
        SELECT c.id FROM categories c
        WHERE c.group_id IS NULL
          AND c.slug IN ('table-calendar') AND grp.name = 'Calendars'
      UNION ALL
        SELECT c.id FROM categories c
        WHERE c.group_id IS NULL
          AND c.slug IN (
            'eco-friendly-memo-pads', 'notebook-with-pen', 'personalized-notebooks'
          ) AND grp.name = 'Note Books & Pads'
      UNION ALL
        SELECT c.id FROM categories c
        WHERE c.group_id IS NULL
          AND c.slug IN (
            'leather-gifts', 'certificate-folders', 'cheque-book-holders',
            'leather-wallets'
          ) AND grp.name = 'Leather Gifts'
      UNION ALL
        SELECT c.id FROM categories c
        WHERE c.group_id IS NULL
          AND c.slug IN (
            'leather-planners', 'leather-planner'
          ) AND grp.name = 'Leather Planners'
      UNION ALL
        SELECT c.id FROM categories c
        WHERE c.group_id IS NULL
          AND c.slug IN (
            'card-holder', 'carry-bags', 'coffee-mug', 'key-chains',
            'promotional-umbrella'
          ) AND grp.name = 'Promotional Gifts'
    LOOP
      UPDATE categories SET group_id = grp.id WHERE id = cat.id;
    END LOOP;
  END LOOP;
END $$;

-- RLS: allow public read (anon needs to see groups for the menu);
-- public write is not allowed (admin via authenticated role only).
ALTER TABLE category_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read category_groups" ON category_groups;
CREATE POLICY "Allow public read category_groups" ON category_groups
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Allow admin write category_groups" ON category_groups;
CREATE POLICY "Allow admin write category_groups" ON category_groups
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
