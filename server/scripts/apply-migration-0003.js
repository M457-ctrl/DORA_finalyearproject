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
    console.log("Applying migration 0003_create_orders_table...\n");

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, "../migrations/sql/0003_create_orders_table.sql"),
      "utf8"
    );

    await pool.query(migrationSQL);

    console.log("✅ Orders table created or already exists.");

    // Verify table exists
    const result = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_name = 'orders';
    `);
    console.log("\nVerification - found tables:");
    console.table(result.rows);

    // Record manual migration
    await pool.query(
      `
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES ('create_orders_table_manual', $1);
    `,
      [Date.now()]
    );

    console.log("\n✅ Migration recorded in drizzle migrations table");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

applyMigration();
