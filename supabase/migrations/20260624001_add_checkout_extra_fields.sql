-- Add customisation, additional info, and logo images columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customisation TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS additional_info TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS logo_images JSONB DEFAULT '[]'::jsonb;
