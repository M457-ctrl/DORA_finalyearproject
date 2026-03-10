const { Pool } = require("pg");
require("dotenv").config();

// Parse DATABASE_URL
let dbUrl = process.env.DATABASE_URL;
if (dbUrl?.startsWith("postgres://")) {
  dbUrl = dbUrl.replace("postgres://", "postgresql://");
}

// Remove sslmode from URL
try {
  const urlObj = new URL(dbUrl);
  urlObj.searchParams.delete("sslmode");
  urlObj.searchParams.delete("ssl");
  dbUrl = urlObj.toString();
} catch (e) {
  // If parsing fails, use original
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false, require: true },
});

async function fixProductsTable() {
  const client = await pool.connect();
  try {
    console.log("🔌 Connected to database");

    // Drop existing products table
    console.log("🗑️  Dropping existing products table...");
    await client.query("DROP TABLE IF EXISTS products CASCADE");

    // Create new products table with correct schema
    console.log("📝 Creating products table...");
    const createTableSQL = `
      CREATE TABLE products (
        id VARCHAR(255) PRIMARY KEY NOT NULL,
        seller_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        crop_name VARCHAR(255) NOT NULL,
        description TEXT DEFAULT '',
        category VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        unit VARCHAR(50) NOT NULL DEFAULT 'kg',
        min_price_expected DECIMAL(10, 2) NOT NULL,
        max_price_expected DECIMAL(10, 2) NOT NULL,
        current_price DECIMAL(10, 2),
        image_url VARCHAR(500),
        harvest_date TIMESTAMP,
        expiry_date TIMESTAMP,
        location VARCHAR(255) DEFAULT '',
        is_available BOOLEAN NOT NULL DEFAULT true,
        view_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await client.query(createTableSQL);
    console.log("✅ Products table created");

    // Create indexes
    console.log("📊 Creating indexes...");
    await client.query(
      "CREATE INDEX idx_products_seller_id ON products(seller_id)"
    );
    await client.query(
      "CREATE INDEX idx_products_category ON products(category)"
    );
    await client.query(
      "CREATE INDEX idx_products_is_available ON products(is_available)"
    );
    await client.query(
      "CREATE INDEX idx_products_created_at ON products(created_at)"
    );

    console.log("✅ All indexes created");
    console.log("🎉 Products table is ready!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

fixProductsTable();
