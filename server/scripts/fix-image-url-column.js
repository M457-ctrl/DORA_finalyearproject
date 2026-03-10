const { pool } = require("../src/config/db");

async function fixImageUrlColumn() {
  const client = await pool.connect();
  try {
    console.log("Altering image_url column to TEXT...");

    // Drop any existing constraints if needed
    await client.query(`
      ALTER TABLE products 
      ALTER COLUMN image_url TYPE TEXT;
    `);

    console.log("✅ Column altered successfully!");
  } catch (error) {
    console.error("Error altering column:", error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixImageUrlColumn();
