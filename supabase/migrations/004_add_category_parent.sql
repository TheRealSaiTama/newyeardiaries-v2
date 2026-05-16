-- Add parent_id for subcategory support
ALTER TABLE categories ADD COLUMN parent_id UUID REFERENCES categories(id) ON DELETE SET NULL;

CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- RLS: already covered by existing category policies
