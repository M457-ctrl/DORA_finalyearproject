const { db } = require("../src/config/db");
const { users } = require("../src/models/users");
const bcrypt = require("bcryptjs");
const { eq } = require("drizzle-orm");
require("dotenv").config();

async function resetPassword() {
  const email = process.argv[2] || "test@gmail.com";
  const newPassword = process.argv[3] || "test123";

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    console.log(`✅ Password reset successful!`);
    console.log(`   Email: ${email}`);
    console.log(`   New Password: ${newPassword}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.isActive}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }

  process.exit(0);
}

resetPassword();
