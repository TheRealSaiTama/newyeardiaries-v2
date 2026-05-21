-- Fix RLS: allow anon to INSERT/UPDATE/DELETE on all admin tables
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/cqrnmyssytgfvgrhhfoz/sql

-- Products: allow admin CRUD
CREATE POLICY "Allow insert products" ON products FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow update products" ON products FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow delete products" ON products FOR DELETE TO anon USING (true);

-- Categories: allow admin CRUD
CREATE POLICY "Allow insert categories" ON categories FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow update categories" ON categories FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow delete categories" ON categories FOR DELETE TO anon USING (true);

-- Banners: allow admin CRUD
CREATE POLICY "Allow insert banners" ON banners FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow update banners" ON banners FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow delete banners" ON banners FOR DELETE TO anon USING (true);

-- Site settings: allow admin CRUD
CREATE POLICY "Allow insert site_settings" ON site_settings FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow update site_settings" ON site_settings FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow delete site_settings" ON site_settings FOR DELETE TO anon USING (true);

-- Fix: admin should see ALL products (not just active ones)
DROP POLICY IF EXISTS "Public read products" ON products;
CREATE POLICY "Public read products" ON products FOR SELECT TO anon USING (true);

-- Public form submissions (contact, bulk quote, legacy enquiries)
-- Required for ContactPage.js + BulkQuotePage.js inserts (anon client) and admin visibility
DROP POLICY IF EXISTS "Allow public inserts contact_submissions" ON contact_submissions;
CREATE POLICY "Allow public inserts contact_submissions" ON contact_submissions FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public inserts quote_requests" ON quote_requests;
CREATE POLICY "Allow public inserts quote_requests" ON quote_requests FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public inserts enquiries" ON enquiries;
CREATE POLICY "Allow public inserts enquiries" ON enquiries FOR INSERT TO anon WITH CHECK (true);

-- Also ensure anon can read/update/delete them (matches 007)
DROP POLICY IF EXISTS "Allow anon read contact_submissions" ON contact_submissions;
CREATE POLICY "Allow anon read contact_submissions" ON contact_submissions FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Allow anon update contact_submissions" ON contact_submissions;
CREATE POLICY "Allow anon update contact_submissions" ON contact_submissions FOR UPDATE TO anon USING (true);
DROP POLICY IF EXISTS "Allow anon delete contact_submissions" ON contact_submissions;
CREATE POLICY "Allow anon delete contact_submissions" ON contact_submissions FOR DELETE TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon read quote_requests" ON quote_requests;
CREATE POLICY "Allow anon read quote_requests" ON quote_requests FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Allow anon update quote_requests" ON quote_requests;
CREATE POLICY "Allow anon update quote_requests" ON quote_requests FOR UPDATE TO anon USING (true);
DROP POLICY IF EXISTS "Allow anon delete quote_requests" ON quote_requests;
CREATE POLICY "Allow anon delete quote_requests" ON quote_requests FOR DELETE TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon read enquiries" ON enquiries;
CREATE POLICY "Allow anon read enquiries" ON enquiries FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Allow anon update enquiries" ON enquiries;
CREATE POLICY "Allow anon update enquiries" ON enquiries FOR UPDATE TO anon USING (true);
DROP POLICY IF EXISTS "Allow anon delete enquiries" ON enquiries;
CREATE POLICY "Allow anon delete enquiries" ON enquiries FOR DELETE TO anon USING (true);
