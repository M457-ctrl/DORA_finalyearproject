-- Migration to update user schema for buyer and seller roles
-- Run this migration to update the database schema

-- Update the user_role enum to include 'seller' instead of 'cooperative'
ALTER TYPE user_role RENAME TO user_role_old;
CREATE TYPE user_role AS ENUM ('admin', 'buyer', 'seller');

-- Update existing users table
ALTER TABLE users 
  ALTER COLUMN role TYPE user_role USING role::text::user_role;

-- Drop the old enum type
DROP TYPE user_role_old;

-- Add new columns for seller information
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255);

-- Update existing 'cooperative' users to 'seller' (if any exist)
UPDATE users SET role = 'seller' WHERE role::text = 'cooperative';
