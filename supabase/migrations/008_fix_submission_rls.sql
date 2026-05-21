-- Fix RLS for public form submissions (contact + bulk quote)
-- The 001_create_tables.sql created permissive INSERT policies for anon on contact_submissions, quote_requests, enquiries.
-- These are required because:
--   - ContactPage.js and BulkQuotePage.js use the anon client to INSERT
--   - Admin UI uses the same anon client (gated only by sessionStorage password) for SELECT/UPDATE/DELETE
-- 007 added the anon SELECT/UPDATE/DELETE, but the INSERT policies for contact_submissions and quote_requests
-- appear to have been dropped or not present in the live DB (enquiries policy survived).
-- This migration is idempotent and safe to run multiple times.

-- Contact Submissions (used by /contact form)
DROP POLICY IF EXISTS "Allow public inserts contact_submissions" ON contact_submissions;
CREATE POLICY "Allow public inserts contact_submissions" ON contact_submissions
  FOR INSERT TO anon WITH CHECK (true);

-- Quote Requests (used by /bulk-quote and quote list flows)
DROP POLICY IF EXISTS "Allow public inserts quote_requests" ON quote_requests;
CREATE POLICY "Allow public inserts quote_requests" ON quote_requests
  FOR INSERT TO anon WITH CHECK (true);

-- Enquiries (legacy table, keep consistent)
DROP POLICY IF EXISTS "Allow public inserts enquiries" ON enquiries;
CREATE POLICY "Allow public inserts enquiries" ON enquiries
  FOR INSERT TO anon WITH CHECK (true);

-- Also ensure the anon read policies from 007 exist (in case of partial apply)
DROP POLICY IF EXISTS "Allow anon read contact_submissions" ON contact_submissions;
CREATE POLICY "Allow anon read contact_submissions" ON contact_submissions FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon read quote_requests" ON quote_requests;
CREATE POLICY "Allow anon read quote_requests" ON quote_requests FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon read enquiries" ON enquiries;
CREATE POLICY "Allow anon read enquiries" ON enquiries FOR SELECT TO anon USING (true);
