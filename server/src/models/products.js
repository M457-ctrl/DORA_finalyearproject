const {
  pgTable,
  varchar,
  text,
  integer,
  decimal,
  timestamp,
  boolean,
  uuid,
} = require("drizzle-orm/pg-core");
const { users } = require("./users");

// Define products table schema
const products = pgTable("products", {
  id: varchar("id", { length: 255 }).primaryKey().notNull(),
  sellerId: varchar("seller_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  cropName: varchar("crop_name", { length: 255 }).notNull(), // e.g., "Rice", "Wheat", "Tomato"
  description: text("description").default(""), // Detailed description of the crop
  category: varchar("category", { length: 255 }).notNull(), // e.g., "Cereals", "Vegetables", "Fruits"
  quantity: integer("quantity").notNull(), // Available quantity in kg or units
  unit: varchar("unit", { length: 50 }).default("kg").notNull(), // "kg", "tons", "bundles", etc.
  minPriceExpected: decimal("min_price_expected", {
    precision: 10,
    scale: 2,
  }).notNull(), // Minimum expected price
  maxPriceExpected: decimal("max_price_expected", {
    precision: 10,
    scale: 2,
  }).notNull(), // Maximum expected price
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }), // Current market price (optional)
  discountPercent: integer("discount_percent").default(0).notNull(), // Discount percentage (0-90)
  imageUrl: text("image_url"), // Image of the product (base64 encoded)
  harvestDate: timestamp("harvest_date"), // When the crop was harvested
  expiryDate: timestamp("expiry_date"), // When the product expires
  location: varchar("location", { length: 255 }).default(""), // Where the crop is located
  isSeasonal: boolean("is_seasonal").default(false).notNull(), // Whether this is a seasonal product
  isAvailable: boolean("is_available").default(true).notNull(), // Whether product is still available
  viewCount: integer("view_count").default(0).notNull(), // Number of times viewed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

module.exports = { products };
