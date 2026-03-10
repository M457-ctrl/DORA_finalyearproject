-- Migration: Add Payment Fields to Orders Table
-- Description: Add payment_method, payment_code, payment_status, and transaction_id fields
-- Date: 2026-02-27

-- Add new columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method varchar(50) DEFAULT 'cod' NOT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_code varchar(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status varchar(50) DEFAULT 'pending' NOT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transaction_id varchar(255);

-- Create index for payment_code for faster lookups
CREATE INDEX IF NOT EXISTS orders_payment_code_idx ON orders(payment_code);
CREATE INDEX IF NOT EXISTS orders_transaction_id_idx ON orders(transaction_id);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders(payment_status);

-- Add constraint to ensure payment_method is either 'cod' or 'esewa'
ALTER TABLE orders ADD CONSTRAINT valid_payment_method 
CHECK (payment_method IN ('cod', 'esewa'));

-- Add constraint to ensure payment_status is valid
ALTER TABLE orders ADD CONSTRAINT valid_payment_status 
CHECK (payment_status IN ('pending', 'completed', 'failed'));

-- Note: Run this migration using:
-- NODE_ENV=production node server/scripts/migrate.js
-- or with node scripts/apply-migration-0002.js
