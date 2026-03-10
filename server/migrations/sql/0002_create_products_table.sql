-- Migration to add products table for crop listings

DROP TABLE IF EXISTS products CASCADE;

CREATE TABLE products (
  id VARCHAR(255) PRIMARY KEY NOT NULL,
  seller_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  crop_name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  category VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit VARCHAR(50) NOT NULL DEFAULT 'kg',
  min_price_expected DECIMAL(10, 2) NOT NULL,
  max_price_expected DECIMAL(10, 2) NOT NULL,
  current_price DECIMAL(10, 2),
  image_url TEXT,
  harvest_date TIMESTAMP,
  expiry_date TIMESTAMP,
  location VARCHAR(255) DEFAULT '',
  is_available BOOLEAN NOT NULL DEFAULT true,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_available ON products(is_available);
CREATE INDEX idx_products_created_at ON products(created_at);
