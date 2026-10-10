-- RLS hardening: stop the PUBLIC anon role from reading customer data.
--
-- Verified 2026-10-10 against the live project: the anon key (which ships in the
-- public JS bundle) could read every row of contact_submissions and
-- quote_requests, including name, email, phone, address and message.
--
-- Migration 20260802001_rls_admin_only.sql was written to fix audit finding C5
-- but these SELECT policies are still open on the live database. This migration
-- actually closes them.
--
-- Keeps public INSERT working, so the contact and quote forms still submit.
-- Apply from the Supabase dashboard -> SQL Editor -> Run.

-- ---------------------------------------------------------------------------
-- contact_submissions
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow anon select contact_submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Allow public read contact_submissions"        ON contact_submissions;
DROP POLICY IF EXISTS "Allow public select contact_submissions"       ON contact_submissions;
DROP POLICY IF EXISTS "Allow anon all contact_submissions"            ON contact_submissions;
DROP POLICY IF EXISTS "Allow public all contact_submissions"          ON contact_submissions;
DROP POLICY IF EXISTS "Admin read contact_submissions"               ON contact_submissions;

CREATE POLICY "Admin read contact_submissions"
  ON contact_submissions FOR SELECT TO authenticated
  USING (true);

-- Customers submit the form anonymously; nobody else may touch it except admin.
DROP POLICY IF EXISTS "Allow public insert contact_submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Allow anon insert contact_submissions"    ON contact_submissions;

CREATE POLICY "Allow public insert contact_submissions"
  ON contact_submissions FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admin manage contact_submissions"
  ON contact_submissions FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Admin delete contact_submissions"
  ON contact_submissions FOR DELETE TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- quote_requests
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow anon select quote_requests" ON quote_requests;
DROP POLICY IF EXISTS "Allow public read quote_requests"  ON quote_requests;
DROP POLICY IF EXISTS "Allow public select quote_requests" ON quote_requests;
DROP POLICY IF EXISTS "Allow anon all quote_requests"      ON quote_requests;
DROP POLICY IF EXISTS "Allow public all quote_requests"    ON quote_requests;
DROP POLICY IF EXISTS "Admin read quote_requests"         ON quote_requests;

CREATE POLICY "Admin read quote_requests"
  ON quote_requests FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow public insert quote_requests" ON quote_requests;
DROP POLICY IF EXISTS "Allow anon insert quote_requests"    ON quote_requests;

CREATE POLICY "Allow public insert quote_requests"
  ON quote_requests FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admin manage quote_requests"
  ON quote_requests FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Admin delete quote_requests"
  ON quote_requests FOR DELETE TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- enquiries
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow anon select enquiries" ON enquiries;
DROP POLICY IF EXISTS "Allow public read enquiries"  ON enquiries;
DROP POLICY IF EXISTS "Allow public select enquiries" ON enquiries;
DROP POLICY IF EXISTS "Allow anon all enquiries"      ON enquiries;
DROP POLICY IF EXISTS "Allow public all enquiries"    ON enquiries;
DROP POLICY IF EXISTS "Admin read enquiries"         ON enquiries;

CREATE POLICY "Admin read enquiries"
  ON enquiries FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin manage enquiries"
  ON enquiries FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- orders: nobody but admin reads. Customers get their receipt via the
-- order-success page, which uses the returned order number, not a table read.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read orders"   ON orders;
DROP POLICY IF EXISTS "Allow public select orders" ON orders;
DROP POLICY IF EXISTS "Allow anon select orders"   ON orders;
DROP POLICY IF EXISTS "Allow anon update orders"   ON orders;
DROP POLICY IF EXISTS "Allow public update orders" ON orders;

CREATE POLICY "Admin read orders"
  ON orders FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin manage orders"
  ON orders FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Admin delete orders"
  ON orders FOR DELETE TO authenticated
  USING (true);

-- Public inserts stay, they are what place_order / checkout rely on.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'orders' AND policyname LIKE '%insert%'
  ) THEN
    CREATE POLICY "Allow public insert orders"
      ON orders FOR INSERT TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;