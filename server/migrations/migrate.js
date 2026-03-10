const { drizzle } = require("drizzle-orm/node-postgres");
const { migrate } = require("drizzle-orm/node-postgres/migrator");
const { Pool } = require("pg");
require("dotenv").config();
const path = require("path");

// Determine SSL configuration based on database URL
function getSSLConfig() {
  const dbUrl = process.env.DATABASE_URL || "";
  
  if (!dbUrl) return false;
  
  try {
    // Check if connection string already has SSL parameters
    const urlObj = new URL(dbUrl);
    const sslMode = urlObj.searchParams.get("sslmode");
    
    // Aiven, Railway, Render, and most cloud providers require SSL
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
      // For Aiven and cloud providers, accept self-signed certificates
      // rejectUnauthorized: false allows self-signed certificates
      return {
        rejectUnauthorized: false,
      };
    }
  } catch (e) {
    // If URL parsing fails, check by string matching
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

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ Error: DATABASE_URL is not set in .env file");
    console.error("Please set DATABASE_URL in your .env file");
    process.exit(1);
  }

  console.log("🔌 Connecting to database...");
  console.log(`📍 Database host: ${extractHostFromURL(process.env.DATABASE_URL)}`);

  // Normalize connection string (postgres:// to postgresql://)
  let dbUrl = process.env.DATABASE_URL;
  if (dbUrl.startsWith("postgres://")) {
    dbUrl = dbUrl.replace("postgres://", "postgresql://");
    console.log("⚠️  Converted postgres:// to postgresql://");
  }

  // Remove SSL parameters from connection string to avoid conflicts
  // We'll set SSL explicitly via the ssl option
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

  const sslConfig = getSSLConfig();
  console.log(`🔒 SSL: ${sslConfig ? "Enabled" : "Disabled"}`);
  if (sslConfig) {
    console.log(`   Config: ${JSON.stringify(sslConfig)}`);
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: sslConfig || undefined, // Use undefined instead of false to ensure SSL is set when needed
    connectionTimeoutMillis: 10000, // 10 seconds timeout
  });

  // Test connection first
  try {
    console.log("🧪 Testing database connection...");
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    console.log("✅ Database connection successful!");
    console.log(`⏰ Server time: ${result.rows[0].now}`);
    client.release();
  } catch (error) {
    console.error("\n❌ Database connection failed!");
    console.error("\nError details:");
    console.error(`  Code: ${error.code || "N/A"}`);
    console.error(`  Message: ${error.message}`);
    
    if (error.code === "ENOTFOUND") {
      console.error("\n💡 DNS lookup failed. Possible issues:");
      console.error("  1. Check if DATABASE_URL hostname is correct");
      console.error("  2. Verify your internet connection");
      console.error("  3. For Aiven: Ensure database is running and accessible");
      console.error("  4. Check if VPN or firewall is blocking the connection");
    } else if (error.code === "ECONNREFUSED") {
      console.error("\n💡 Connection refused. Possible issues:");
      console.error("  1. Database server might be down");
      console.error("  2. Port number might be incorrect");
      console.error("  3. Firewall might be blocking the connection");
    } else if (error.code === "ETIMEDOUT") {
      console.error("\n💡 Connection timeout. Possible issues:");
      console.error("  1. Database server might be unreachable");
      console.error("  2. Network connectivity issues");
      console.error("  3. Firewall blocking the connection");
    }
    
    console.error("\n📝 Current DATABASE_URL format:");
    console.error(`  ${maskDatabaseURL(process.env.DATABASE_URL)}`);
    console.error("\n💡 For Aiven databases, ensure:");
    console.error("  - SSL is enabled (should be automatic)");
    console.error("  - Database is running and accessible");
    console.error("  - Connection string includes SSL parameters");
    
    await pool.end();
    process.exit(1);
  }

  const db = drizzle(pool);

  console.log("\n📦 Running migrations...");
  
  try {
    await migrate(db, {
      migrationsFolder: path.join(__dirname, "./sql"),
    });
    console.log("\n✅ Migrations completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration error:");
    console.error(`  ${error.message}`);
    if (error.query) {
      console.error(`  Failed query: ${error.query}`);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Helper function to extract host from URL
function extractHostFromURL(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return "Unable to parse";
  }
}

// Helper function to mask sensitive parts of URL
function maskDatabaseURL(url) {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.username}:****@${urlObj.hostname}${urlObj.pathname}`;
  } catch {
    return url.replace(/:[^:@]+@/, ":****@");
  }
}

runMigrations();

