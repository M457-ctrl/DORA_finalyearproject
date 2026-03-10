-- Add is_seasonal column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_seasonal BOOLEAN DEFAULT FALSE NOT NULL;
