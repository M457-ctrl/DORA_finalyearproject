const { Pool } = require("pg");
require("dotenv").config();

async function checkSchema() {
  let dbUrl = process.env.DATABASE_URL.replace("postgres://", "postgresql://");
  const urlObj = new URL(dbUrl);
  urlObj.searchParams.delete("sslmode");
  dbUrl = urlObj.toString();

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("Checking users table schema...\n");

    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log("Columns in users table:");
    console.table(result.rows);

    // Check migrations table
    const migrations = await pool.query(`
      SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at;
    `);

    console.log("\nApplied migrations:");
    console.table(migrations.rows);
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
