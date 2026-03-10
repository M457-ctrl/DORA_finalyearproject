require("dotenv").config();

// Determine SSL configuration for Drizzle Kit
function getSSLConfig() {
  const dbUrl = process.env.DATABASE_URL || "";
  
  if (
    dbUrl.includes("aivencloud.com") ||
    dbUrl.includes("railway.app") ||
    dbUrl.includes("render.com") ||
    dbUrl.includes("supabase.co") ||
    dbUrl.includes("neon.tech") ||
    process.env.NODE_ENV === "production"
  ) {
    return { rejectUnauthorized: false };
  }
  
  return undefined;
}

const sslConfig = getSSLConfig();

module.exports = {
  schema: "./src/models/users.js",
  out: "./migrations/sql",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
    ...(sslConfig && { ssl: sslConfig }),
  },
};

