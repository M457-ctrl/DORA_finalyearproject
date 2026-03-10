-- Add discount_percent column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0 NOT NULL;
