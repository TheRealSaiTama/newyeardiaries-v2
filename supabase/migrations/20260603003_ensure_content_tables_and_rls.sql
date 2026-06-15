-- Ensure content tables exist and are writable by the anon role used by the admin dashboard.
-- site_content / homepage_sections were created outside migrations and lack write policies,
-- causing "new row violates row-level security policy" errors when saving header/homepage.

-- ===== site_content (key-value, keyed by section + key) =====
CREATE TABLE IF NOT EXISTS site_content (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  section text NOT NULL DEFAULT 'general',
  key text NOT NULL,
  value text
);
CREATE UNIQUE INDEX IF NOT EXISTS site_content_section_key_idx ON site_content (section, key);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read site_content" ON site_content;
CREATE POLICY "Public read site_content" ON site_content FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Allow insert site_content" ON site_content;
CREATE POLICY "Allow insert site_content" ON site_content FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update site_content" ON site_content;
CREATE POLICY "Allow update site_content" ON site_content FOR UPDATE TO anon USING (true);
DROP POLICY IF EXISTS "Allow delete site_content" ON site_content;
CREATE POLICY "Allow delete site_content" ON site_content FOR DELETE TO anon USING (true);

-- ===== homepage_sections (upsertable by section_key) =====
CREATE TABLE IF NOT EXISTS homepage_sections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key text UNIQUE NOT NULL,
  title text,
  subtitle text,
  cta_text text,
  cta_link text,
  second_cta_text text,
  second_cta_link text,
  image_url text,
  sort_order int DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read homepage_sections" ON homepage_sections;
CREATE POLICY "Public read homepage_sections" ON homepage_sections FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Allow insert homepage_sections" ON homepage_sections;
CREATE POLICY "Allow insert homepage_sections" ON homepage_sections FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update homepage_sections" ON homepage_sections;
CREATE POLICY "Allow update homepage_sections" ON homepage_sections FOR UPDATE TO anon USING (true);
DROP POLICY IF EXISTS "Allow delete homepage_sections" ON homepage_sections;
CREATE POLICY "Allow delete homepage_sections" ON homepage_sections FOR DELETE TO anon USING (true);

-- ===== footer_sections (created by 20260603002; ensure RLS allows admin access) =====
ALTER TABLE footer_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read footer_sections" ON footer_sections;
CREATE POLICY "Public read footer_sections" ON footer_sections FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Allow insert footer_sections" ON footer_sections;
CREATE POLICY "Allow insert footer_sections" ON footer_sections FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update footer_sections" ON footer_sections;
CREATE POLICY "Allow update footer_sections" ON footer_sections FOR UPDATE TO anon USING (true);
DROP POLICY IF EXISTS "Allow delete footer_sections" ON footer_sections;
CREATE POLICY "Allow delete footer_sections" ON footer_sections FOR DELETE TO anon USING (true);
