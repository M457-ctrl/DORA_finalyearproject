const { Pool } = require("pg");
require("dotenv").config();

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
    console.log("Applying safe migration...\n");

    // Step 1: Add seller to existing enum
    console.log("1. Adding 'seller' to user_role enum...");
    await pool.query(`
      ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'seller';
    `);
    console.log("✅ Done");

    // Step 2: Add new columns
    console.log("\n2. Adding company_name and vendor_name columns...");
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255);
    `);
    console.log("✅ Done");

    // Step 3: Update any 'cooperative' users to 'seller'
    console.log("\n3. Updating any 'cooperative' role to 'seller'...");
    const updateResult = await pool.query(`
      UPDATE users SET role = 'seller' WHERE role::text = 'cooperative';
    `);
    console.log(`✅ Updated ${updateResult.rowCount} rows`);

    // Verify columns now exist
    const result = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users' AND column_name IN ('company_name', 'vendor_name')
      ORDER BY column_name;
    `);

    console.log("\n✅ Migration completed! New columns:");
    console.table(result.rows);

    // Check current enum values
    const enumResult = await pool.query(`
      SELECT unnest(enum_range(NULL::user_role))::text as role;
    `);
    console.log("\nCurrent user_role enum values:");
    console.table(enumResult.rows);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

applyMigration();
