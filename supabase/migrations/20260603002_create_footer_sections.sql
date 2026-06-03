-- Create footer_sections table for editable footer blocks
CREATE TABLE IF NOT EXISTS footer_sections (
  id serial PRIMARY KEY,
  section_key text UNIQUE NOT NULL,
  title text,
  content text,
  sort_order int DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed initial keys (empty content, admin will fill)
INSERT INTO footer_sections (section_key, title, content, sort_order) VALUES
('about_left', 'About Left', '', 1),
('exporter_right', 'Exporter Right', '', 2),
('services_list', 'Services List', '', 3)
ON CONFLICT (section_key) DO NOTHING;
