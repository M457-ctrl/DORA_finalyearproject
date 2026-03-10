const { Pool } = require("pg");
require("dotenv").config();

// Determine SSL configuration based on database URL
function getSSLConfig() {
  const dbUrl = process.env.DATABASE_URL || "";
  
  if (!dbUrl) return false;
  
  let sslMode = null;
  try {
    // Check if connection string already has SSL parameters
    const urlObj = new URL(dbUrl);
    sslMode = urlObj.searchParams.get("sslmode");
  } catch (e) {
    // URL parsing failed, continue with string matching
  }
  
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
  
  return false;
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

// Helper function to extract host from URL
function extractHostFromURL(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return "Unable to parse";
  }
}

async function testConnection() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ Error: DATABASE_URL is not set in .env file");
    console.error("Please set DATABASE_URL in your .env file");
    process.exit(1);
  }

  console.log("🔌 Testing database connection...");
  console.log(`📍 Database host: ${extractHostFromURL(process.env.DATABASE_URL)}`);
  
  const sslConfig = getSSLConfig();
  console.log(`🔒 SSL: ${sslConfig ? "Enabled" : "Disabled"}`);
  if (sslConfig) {
    console.log(`   Config: ${JSON.stringify(sslConfig)}`);
  }
  console.log(`📝 Connection string: ${maskDatabaseURL(process.env.DATABASE_URL)}\n`);

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

  console.log(`📝 Normalized connection string: ${maskDatabaseURL(dbUrl)}\n`);

  // Parse connection string into individual parameters for better SSL control
  let poolConfig;
  try {
    const urlObj = new URL(dbUrl);
    poolConfig = {
      host: urlObj.hostname,
      port: parseInt(urlObj.port) || 5432,
      database: urlObj.pathname.slice(1) || "postgres", // Remove leading /
      user: urlObj.username,
      password: urlObj.password,
      ssl: sslConfig || false,
      connectionTimeoutMillis: 10000,
    };
  } catch (e) {
    // Fallback to connectionString if parsing fails
    poolConfig = {
      connectionString: dbUrl,
      ssl: sslConfig || undefined,
      connectionTimeoutMillis: 10000,
    };
  }

  const pool = new Pool(poolConfig);

  try {
    const client = await pool.connect();
    console.log("✅ Connection successful!\n");

    // Test query
    const result = await client.query("SELECT NOW() as current_time, version() as version");
    console.log("📊 Database Information:");
    console.log(`   Current Time: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL Version: ${result.rows[0].version.split(" ")[0]} ${result.rows[0].version.split(" ")[1]}`);

    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log(`\n📋 Tables in database (${tablesResult.rows.length}):`);
      tablesResult.rows.forEach((row) => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log("\n📋 No tables found in database");
      console.log("   Run migrations: npm run db:migrate");
    }

    client.release();
    console.log("\n✅ Connection test completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Connection test failed!\n");
    console.error("Error details:");
    console.error(`  Code: ${error.code || "N/A"}`);
    console.error(`  Message: ${error.message}\n`);

    if (error.code === "ENOTFOUND") {
      console.error("💡 DNS lookup failed. Possible solutions:");
      console.error("  1. Verify DATABASE_URL hostname is correct");
      console.error("  2. Check your internet connection");
      console.error("  3. For Aiven: Ensure database is running");
      console.error("  4. Try pinging the hostname: ping <hostname>");
      console.error("  5. Check if VPN or firewall is blocking DNS");
    } else if (error.code === "ECONNREFUSED") {
      console.error("💡 Connection refused. Possible solutions:");
      console.error("  1. Database server might be down");
      console.error("  2. Port number might be incorrect");
      console.error("  3. Firewall might be blocking the connection");
      console.error("  4. Check if database is accessible from your network");
    } else if (error.code === "ETIMEDOUT") {
      console.error("💡 Connection timeout. Possible solutions:");
      console.error("  1. Database server might be unreachable");
      console.error("  2. Network connectivity issues");
      console.error("  3. Firewall blocking the connection");
      console.error("  4. Database might be paused (check Aiven dashboard)");
    } else if (error.code === "28P01") {
      console.error("💡 Authentication failed. Possible solutions:");
      console.error("  1. Check username and password in DATABASE_URL");
      console.error("  2. Verify credentials in your database provider dashboard");
    } else if (error.code === "3D000") {
      console.error("💡 Database does not exist. Possible solutions:");
      console.error("  1. Create the database first");
      console.error("  2. Check database name in DATABASE_URL");
    } else if (error.code === "SELF_SIGNED_CERT_IN_CHAIN" || error.message.includes("self-signed certificate")) {
      console.error("💡 SSL Certificate error. This should be fixed automatically.");
      console.error("   The code is configured to accept self-signed certificates for Aiven.");
      console.error("   If you still see this error, try:");
      console.error("   1. Ensure DATABASE_URL includes ?sslmode=require");
      console.error("   2. Check if SSL configuration is being applied correctly");
      console.error("   3. Verify the connection string format");
      console.error("\n   Current SSL config:", JSON.stringify(getSSLConfig(), null, 2));
    }

    console.error("\n📝 Troubleshooting steps:");
    console.error("  1. Verify DATABASE_URL in .env file");
    console.error("  2. For Aiven: Check database status in Aiven console");
    console.error("  3. Test connection from Aiven console");
    console.error("  4. Ensure database allows connections from your IP");
    
    await pool.end();
    process.exit(1);
  }
}

testConnection();

