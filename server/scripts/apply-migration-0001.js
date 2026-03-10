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
    console.log("Applying migration 0001_update_user_roles...\n");

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, "../migrations/sql/0001_update_user_roles.sql"),
      "utf8"
    );

    await pool.query(migrationSQL);

    console.log("✅ Migration applied successfully!");

    // Verify columns now exist
    const result = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users' AND column_name IN ('company_name', 'vendor_name');
    `);

    console.log("\nVerification - found columns:");
    console.table(result.rows);

    // Update drizzle migrations table
    await pool.query(
      `
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES ('update_user_roles_manual', $1);
    `,
      [Date.now()]
    );

    console.log("\n✅ Migration recorded in drizzle migrations table");
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.message.includes("already exists")) {
      console.log("\n⚠️  Columns might already exist. Verifying...");
      const result = await pool.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'users' AND column_name IN ('company_name', 'vendor_name');
      `);
      console.table(result.rows);
    }
  } finally {
    await pool.end();
  }
}

applyMigration();
