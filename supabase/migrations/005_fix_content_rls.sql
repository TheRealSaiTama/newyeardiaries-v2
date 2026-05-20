-- Enable RLS and add policies for announcements table
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read announcements" ON announcements FOR SELECT TO anon USING (true);
CREATE POLICY "Allow insert announcements" ON announcements FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow update announcements" ON announcements FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow delete announcements" ON announcements FOR DELETE TO anon USING (true);

-- Also ensure banners RLS is correct (idempotent)
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read banners" ON banners;
CREATE POLICY "Public read banners" ON banners FOR SELECT TO anon USING (active = true);
DROP POLICY IF EXISTS "Allow insert banners" ON banners;
CREATE POLICY "Allow insert banners" ON banners FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update banners" ON banners;
CREATE POLICY "Allow update banners" ON banners FOR UPDATE TO anon USING (true);
DROP POLICY IF EXISTS "Allow delete banners" ON banners;
CREATE POLICY "Allow delete banners" ON banners FOR DELETE TO anon USING (true);