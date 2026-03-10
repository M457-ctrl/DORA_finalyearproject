const { Client } = require("pg");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL not found in environment variables");
  process.exit(1);
}

function getSSLConfig() {
  const dbUrl = connectionString || "";
  if (
    dbUrl.includes("aivencloud.com") ||
    dbUrl.includes("railway.app") ||
    dbUrl.includes("render.com") ||
    dbUrl.includes("supabase.co") ||
    dbUrl.includes("neon.tech")
  ) {
    return { rejectUnauthorized: false };
  }
  return false;
}

async function applyMigration() {
  const client = new Client({
    connectionString,
    ssl: getSSLConfig(),
  });

  try {
    await client.connect();
    console.log("✅ Connected to database");

    // Add subadmin to user_role enum
    console.log("Adding 'subadmin' to user_role enum...");

    await client.query(`
      ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'subadmin';
    `);

    console.log("✅ Added 'subadmin' to user_role enum");

    // Record migration
    const migrationName = "0005_add_subadmin_role";
    const timestamp = Date.now();
    await client.query(
      `
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING;
    `,
      [migrationName, timestamp]
    );

    console.log("✅ Migration recorded");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log("✅ Database connection closed");
  }
}

applyMigration();
