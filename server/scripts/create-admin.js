const { db } = require("../src/config/db");
const { users } = require("../src/models/users");
const bcrypt = require("bcryptjs");
const { nanoid } = require("nanoid");
const { eq } = require("drizzle-orm");
require("dotenv").config();

async function createAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error("Usage: node scripts/create-admin.js <email> <password>");
    console.error(
      "Example: node scripts/create-admin.js admin@example.com securepassword123"
    );
    process.exit(1);
  }

  try {
    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser) {
      // Update existing user to admin
      const hashedPassword = await bcrypt.hash(password, 12);
      await db
        .update(users)
        .set({
          password: hashedPassword,
          role: "admin",
          isActive: true,
          isEmailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id));

      console.log(` User ${email} updated to admin role`);
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash(password, 12);
      const userId = nanoid();

      await db.insert(users).values({
        id: userId,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: "admin",
        isActive: true,
        isEmailVerified: true,
      });

      console.log(`✓ Admin user created: ${email}`);
    }

    console.log("\nAdmin credentials:");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log("\n  Keep these credentials secure!");
  } catch (error) {
    console.error(" Error creating admin:", error.message);
    if (error.code === "ECONNREFUSED") {
      console.error(
        "   Database connection failed. Check your DATABASE_URL in .env"
      );
    }
    process.exit(1);
  }

  process.exit(0);
}

createAdmin();


