const { drizzle } = require("drizzle-orm/node-postgres");
const { Pool } = require("pg");
require("dotenv").config();

function getSSLConfig() {
  const dbUrl = process.env.DATABASE_URL || "";

  if (!dbUrl) return false;

  try {
    // Check if connection string already has SSL parameters
    const urlObj = new URL(dbUrl);
    const sslMode = urlObj.searchParams.get("sslmode");

    // Check if provider requires SSL (cloud databases)
    if (
      dbUrl.includes("aivencloud.com") ||
      dbUrl.includes("railway.app") ||
      dbUrl.includes("render.com") ||
      dbUrl.includes("supabase.co") ||
      dbUrl.includes("neon.tech") ||
      sslMode === "require" ||
      sslMode === "prefer" ||
      process.env.NODE_ENV === "production"
    ) {
      // rejectUnauthorized: false allows self-signed certificates
      // Required for cloud providers that use self-signed certs
      return {
        rejectUnauthorized: false,
      };
    }
  } catch (e) {
    // If URL parsing fails, use string matching as fallback
    if (
      dbUrl.includes("aivencloud.com") ||
      dbUrl.includes("railway.app") ||
      dbUrl.includes("render.com") ||
      dbUrl.includes("supabase.co") ||
      dbUrl.includes("neon.tech") ||
      process.env.NODE_ENV === "production"
    ) {
      return {
        rejectUnauthorized: false,
        require: true,
      };
    }
  }

  return false;
}

let dbUrl = process.env.DATABASE_URL;
if (dbUrl && dbUrl.startsWith("postgres://")) {
  dbUrl = dbUrl.replace("postgres://", "postgresql://");
}

if (dbUrl) {
  try {
    const urlObj = new URL(dbUrl);
    urlObj.searchParams.delete("sslmode");
    urlObj.searchParams.delete("ssl");
    dbUrl = urlObj.toString();
  } catch (e) {
    // If URL parsing fails, try simple string replacement
    dbUrl = dbUrl.replace(/[?&]sslmode=[^&]*/g, "");
    dbUrl = dbUrl.replace(/[?&]ssl=[^&]*/g, "");
  }
}

const sslConfig = getSSLConfig();

const pool = new Pool({
  connectionString: dbUrl,
  ssl: sslConfig || undefined,
  connectionTimeoutMillis: 10000, // Wait max 10 seconds to connect
  idleTimeoutMillis: 30000, // Keep idle connections for 30 seconds
  max: 20, // Maximum 20 concurrent connections
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

const db = drizzle(pool);

// ============ EXPORT ============
module.exports = { db, pool };
