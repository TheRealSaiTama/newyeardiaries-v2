-- Migration: Add SEO and metadata fields to category_groups and categories
ALTER TABLE category_groups ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE category_groups ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE category_groups ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE category_groups ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE category_groups ADD COLUMN IF NOT EXISTS meta_keywords TEXT;
ALTER TABLE category_groups ADD COLUMN IF NOT EXISTS og_image_url TEXT;

ALTER TABLE categories ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS meta_keywords TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS og_image_url TEXT;
