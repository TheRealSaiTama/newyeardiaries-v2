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
