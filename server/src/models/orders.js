const {
  pgTable,
  varchar,
  integer,
  decimal,
  timestamp,
  text,
} = require("drizzle-orm/pg-core");
const { users } = require("./users");
const { products } = require("./products");

const orders = pgTable("orders", {
  id: varchar("id", { length: 255 }).primaryKey().notNull(),
  productId: varchar("product_id", { length: 255 })
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  sellerId: varchar("seller_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  buyerId: varchar("buyer_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  discountPercent: integer("discount_percent").default(0).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),

  // Payment Fields
  paymentMethod: varchar("payment_method", { length: 50 })
    .default("cod")
    .notNull(), // "cod", "esewa", or "khalti"
  paymentCode: varchar("payment_code", { length: 255 }), // Generated code for COD or provider payment ID
  paymentStatus: varchar("payment_status", { length: 50 })
    .default("pending")
    .notNull(), // "pending", "completed", "failed"
  transactionId: varchar("transaction_id", { length: 255 }), // Provider transaction ID

  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

module.exports = { orders };
