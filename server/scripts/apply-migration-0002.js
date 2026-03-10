#!/usr/bin/env node

/**
 * Migration Script: Add Payment Fields to Orders Table
 *
 * Usage: node server/scripts/apply-migration-0002.js
 *
 * This script adds payment-related columns to the orders table:
 * - payment_method: 'cod' or 'esewa'
 * - payment_code: Payment reference/transaction code
 * - payment_status: 'pending', 'completed', 'failed'
 * - transaction_id: eSewa transaction ID
 */

const pg = require("pg");
const fs = require("fs");
const path = require("path");

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
});

async function applyMigration() {
  try {
    console.log("🔄 Connecting to database...");
    await client.connect();

    console.log("📝 Applying migration: Add payment fields to orders table...");

    // Read the SQL migration file
    const sqlPath = path.join(
      __dirname,
      "../migrations/sql/0002_add_payment_fields.sql",
    );
    const sql = fs.readFileSync(sqlPath, "utf-8");

    // Execute the migration
    await client.query(sql);

    console.log("✅ Migration applied successfully!");
    console.log("\nNew columns added to orders table:");
    console.log("  - payment_method (default: 'cod')");
    console.log("  - payment_code (reference/transaction code)");
    console.log("  - payment_status (default: 'pending')");
    console.log("  - transaction_id (eSewa transaction ID)");
    console.log("\nIndexes created for faster lookups:");
    console.log("  - orders_payment_code_idx");
    console.log("  - orders_transaction_id_idx");
    console.log("  - orders_payment_status_idx");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
