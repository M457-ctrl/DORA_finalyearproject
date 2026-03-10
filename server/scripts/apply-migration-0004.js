const { Pool } = require("pg");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

async function applyMigration() {
  let dbUrl = process.env.DATABASE_URL.replace("postgres://", "postgresql://");
  const urlObj = new URL(dbUrl);
  urlObj.searchParams.delete("sslmode");
  dbUrl = urlObj.toString();

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("Applying migration 0004_add_discount_to_products...\n");

    const migrationSQL = fs.readFileSync(
      path.join(
        __dirname,
        "../migrations/sql/0004_add_discount_to_products.sql"
      ),
      "utf8"
    );

    await pool.query(migrationSQL);

    console.log("✅ Discount column added to products table.");

    // Verify column exists
    const result = await pool.query(`
      SELECT column_name, data_type, column_default FROM information_schema.columns
      WHERE table_name = 'products' AND column_name = 'discount_percent';
    `);
    console.log("\nVerification - found column:");
    console.table(result.rows);

    // Record manual migration
    await pool.query(
      `
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES ('add_discount_to_products_manual', $1);
    `,
      [Date.now()]
    );

    console.log("\n✅ Migration recorded in drizzle migrations table");
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.message.includes("already exists")) {
      console.log("\n⚠️  Column might already exist. Verifying...");
      const result = await pool.query(`
        SELECT column_name, data_type, column_default FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'discount_percent';
      `);
      console.table(result.rows);
    }
  } finally {
    await pool.end();
  }
}

applyMigration();
