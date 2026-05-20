-- Fix enquiry tables: allow anon SELECT/UPDATE/DELETE (admin uses anon key)
-- Add enquiry_code columns for unique tracking

-- Contact Submissions: add anon read/write/delete
CREATE POLICY "Allow anon read contact_submissions" ON contact_submissions FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon update contact_submissions" ON contact_submissions FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon delete contact_submissions" ON contact_submissions FOR DELETE TO anon USING (true);

-- Quote Requests: add anon read/write/delete
CREATE POLICY "Allow anon read quote_requests" ON quote_requests FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon update quote_requests" ON quote_requests FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon delete quote_requests" ON quote_requests FOR DELETE TO anon USING (true);

-- Enquiries: add anon read/write/delete
CREATE POLICY "Allow anon read enquiries" ON enquiries FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon update enquiries" ON enquiries FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon delete enquiries" ON enquiries FOR DELETE TO anon USING (true);

-- Add enquiry_code columns
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS enquiry_code TEXT;
ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS enquiry_code TEXT;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS enquiry_code TEXT;

-- Add phone column to contact_submissions if missing
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add product_names column to quote_requests (for showing which products)
ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS product_names TEXT;

-- Add company column to enquiries if missing
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS company TEXT;
