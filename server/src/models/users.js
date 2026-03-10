const {
  pgTable,
  varchar,
  timestamp,
  boolean,
  pgEnum,
} = require("drizzle-orm/pg-core");

// Define user role enum
const userRoleEnum = pgEnum("user_role", [
  "admin",
  "subadmin",
  "buyer",
  "seller",
]);

// Define users table schema
const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey().notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull().default("buyer"),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  // Seller-specific fields
  companyName: varchar("company_name", { length: 255 }),
  vendorName: varchar("vendor_name", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
  isEmailVerified: boolean("is_email_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

module.exports = { users, userRoleEnum };
