-- Migration: Allow Khalti as a valid payment method in orders table
-- Date: 2026-03-12

ALTER TABLE orders DROP CONSTRAINT IF EXISTS valid_payment_method;

ALTER TABLE orders
ADD CONSTRAINT valid_payment_method
CHECK (payment_method IN ('cod', 'esewa', 'khalti'));
