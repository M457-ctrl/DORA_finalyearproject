#!/usr/bin/env node

/**
 * Migration Script: Allow Khalti payment method in orders table
 *
 * Usage: node scripts/apply-migration-khalti.js
 */

const pg = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

function getSSLConfig() {
  const dbUrl = process.env.DATABASE_URL || "";
  if (!dbUrl) return false;

  try {
    const urlObj = new URL(dbUrl);
    const sslMode = urlObj.searchParams.get("sslmode");

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
      return { rejectUnauthorized: false };
    }
  } catch {
    if (
      dbUrl.includes("aivencloud.com") ||
      dbUrl.includes("railway.app") ||
      dbUrl.includes("render.com") ||
      dbUrl.includes("supabase.co") ||
      dbUrl.includes("neon.tech") ||
      process.env.NODE_ENV === "production"
    ) {
      return { rejectUnauthorized: false, require: true };
    }
  }

  return false;
}

function getDatabaseUrl() {
  let dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error("DATABASE_URL is not set in server/.env");
  }

  if (dbUrl.startsWith("postgres://")) {
    dbUrl = dbUrl.replace("postgres://", "postgresql://");
  }

  try {
    const urlObj = new URL(dbUrl);
    urlObj.searchParams.delete("sslmode");
    urlObj.searchParams.delete("ssl");
    dbUrl = urlObj.toString();
  } catch {
    dbUrl = dbUrl.replace(/[?&]sslmode=[^&]*/g, "");
    dbUrl = dbUrl.replace(/[?&]ssl=[^&]*/g, "");
  }

  return dbUrl;
}

const client = new pg.Client({
  connectionString: getDatabaseUrl(),
  ssl: getSSLConfig() || undefined,
});

async function applyMigration() {
  try {
    console.log("Connecting to database...");
    await client.connect();

    console.log("Applying migration: allow khalti payment method...");
    const sqlPath = path.join(
      __dirname,
      "../migrations/sql/0005_allow_khalti_payment_method.sql",
    );
    const sql = fs.readFileSync(sqlPath, "utf-8");
    await client.query(sql);

    console.log("Migration applied successfully.");
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
