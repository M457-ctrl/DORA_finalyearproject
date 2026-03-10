#!/usr/bin/env node

const { Pool } = require("pg");
require("dotenv").config();

async function ensureProductsColumns() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("Ensuring products table has required columns...");

    await pool.query(
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0 NOT NULL;",
    );
    await pool.query(
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS is_seasonal BOOLEAN DEFAULT FALSE NOT NULL;",
    );

    console.log("✓ Products columns ensured");
  } catch (error) {
    console.error("✗ Failed to update products table:", error.message);
    if (error.detail) {
      console.error("Detail:", error.detail);
    }
    if (error.hint) {
      console.error("Hint:", error.hint);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

ensureProductsColumns();
