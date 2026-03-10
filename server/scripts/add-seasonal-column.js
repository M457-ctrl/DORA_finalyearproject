#!/usr/bin/env node

/**
 * Add is_seasonal column to products table
 * Run with: node scripts/add-seasonal-column.js
 */

const { db } = require("../src/config/db");
const { sql } = require("drizzle-orm");

async function addSeasonalColumn() {
  try {
    console.log("Adding is_seasonal column to products table...");

    // Execute raw SQL to add the column if it doesn't exist
    await db.execute(
      sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_seasonal BOOLEAN DEFAULT FALSE NOT NULL;`,
    );

    console.log("✓ Successfully added is_seasonal column!");
    process.exit(0);
  } catch (error) {
    console.error("✗ Error adding is_seasonal column:", error.message);
    process.exit(1);
  }
}

addSeasonalColumn();
