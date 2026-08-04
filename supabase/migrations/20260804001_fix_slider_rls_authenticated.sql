-- homepage_slider_sections / items only had TO anon policies.
-- Admin is signed in as authenticated, so SELECT returned 0 rows and the
-- UI said "No slider sections yet" even when 5 rows exist.

DO $$ BEGIN
  CREATE POLICY "Admin all homepage_slider_sections"
    ON homepage_slider_sections FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admin all homepage_slider_items"
    ON homepage_slider_items FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Public storefront still uses anon SELECT policies from 20260620002.
