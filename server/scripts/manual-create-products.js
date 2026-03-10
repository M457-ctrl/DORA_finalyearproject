const { drizzle } = require("drizzle-orm/node-postgres");
const { migrate } = require("drizzle-orm/node-postgres/migrator");
const { Pool } = require("pg");
const path = require("path");
require("dotenv").config();

// SSL config for Aiven
const sslConfig = process.env.DATABASE_URL?.includes("aivencloud.com")
  ? { rejectUnauthorized: false, require: true }
  : false;

// Normalize DATABASE_URL
let dbUrl = process.env.DATABASE_URL;
if (dbUrl?.startsWith("postgres://")) {
  dbUrl = dbUrl.replace("postgres://", "postgresql://");
}

// Remove sslmode from URL to avoid conflicts
try {
  const urlObj = new URL(dbUrl);
  urlObj.searchParams.delete("sslmode");
  urlObj.searchParams.delete("ssl");
  dbUrl = urlObj.toString();
} catch (e) {
  // If parsing fails, use original
}

async function runMigrations() {
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: sslConfig,
  });

  try {
    console.log("🔌 Connecting to database...");
    const db = drizzle(pool);

    console.log("📦 Running migrations...");
    await migrate(db, {
      migrationsFolder: path.join(__dirname, "../migrations/sql"),
    });

    console.log("✅ Products table created successfully!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
