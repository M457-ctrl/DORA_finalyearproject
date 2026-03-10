const bcrypt = require("bcryptjs");
const { db } = require("../config/db");
const { users } = require("../models/users");
const { products } = require("../models/products");
const { orders } = require("../models/orders");
const { eq, and, or } = require("drizzle-orm");
const { nanoid } = require("nanoid");

// GET /api/admin/sellers
// Optional query: status=pending|active|all
exports.listSellers = async (req, res) => {
  try {
    const { status = "all" } = req.query;

    let whereClause = eq(users.role, "seller");
    if (status === "pending") {
      whereClause = and(eq(users.role, "seller"), eq(users.isActive, false));
    } else if (status === "active") {
      whereClause = and(eq(users.role, "seller"), eq(users.isActive, true));
    }

    let rows = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        companyName: users.companyName,
        vendorName: users.vendorName,
        isActive: users.isActive,
        isEmailVerified: users.isEmailVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(whereClause);
    // Append stats per seller (orders count and revenue)
    const withStats = await Promise.all(
      rows.map(async (s) => {
        try {
          const sellerOrders = await db
            .select({ totalPrice: orders.totalPrice })
            .from(orders)
            .where(eq(orders.sellerId, s.id));
          const ordersCount = sellerOrders.length;
          const totalRevenue = sellerOrders.reduce(
            (sum, o) => sum + Number(o.totalPrice || 0),
            0
          );
          return { ...s, ordersCount, totalRevenue };
        } catch (err) {
          if (err && err.code === "42P01") {
            // relation does not exist (orders table missing)
            return { ...s, ordersCount: 0, totalRevenue: 0 };
          }
          throw err;
        }
      })
    );

    res.json({ success: true, data: withStats });
  } catch (error) {
    console.error("List sellers error:", error);
    res.status(500).json({
      success: false,
      message: "Error listing sellers",
      error: error.message,
    });
  }
};

// GET /api/admin/sellers/:id
exports.getSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const [row] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        companyName: users.companyName,
        vendorName: users.vendorName,
        isActive: users.isActive,
        isEmailVerified: users.isEmailVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id));

    if (!row)
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });

    const prodCount = await db
      .select({})
      .from(products)
      .where(eq(products.sellerId, id));

    let ordersCount = 0;
    let totalRevenue = 0;
    try {
      const sellerOrders = await db
        .select({ totalPrice: orders.totalPrice })
        .from(orders)
        .where(eq(orders.sellerId, id));
      ordersCount = sellerOrders.length;
      totalRevenue = sellerOrders.reduce(
        (sum, o) => sum + Number(o.totalPrice || 0),
        0
      );
    } catch (err) {
      if (!(err && err.code === "42P01")) {
        throw err;
      }
      // Orders table missing; keep default zeros
    }

    res.json({
      success: true,
      data: {
        ...row,
        productsCount: prodCount.length,
        ordersCount,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error("Get seller error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching seller",
      error: error.message,
    });
  }
};

// PATCH /api/admin/sellers/:id/approve
exports.approveSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await db
      .update(users)
      .set({ isActive: true, role: "seller", updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        isActive: users.isActive,
        role: users.role,
      });

    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });
    res.json({ success: true, message: "Seller approved", data: updated });
  } catch (error) {
    console.error("Approve seller error:", error);
    res.status(500).json({
      success: false,
      message: "Error approving seller",
      error: error.message,
    });
  }
};

// PATCH /api/admin/sellers/:id/deactivate
exports.deactivateSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        isActive: users.isActive,
        role: users.role,
      });

    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });
    res.json({ success: true, message: "Seller deactivated", data: updated });
  } catch (error) {
    console.error("Deactivate seller error:", error);
    res.status(500).json({
      success: false,
      message: "Error deactivating seller",
      error: error.message,
    });
  }
};

// DELETE /api/admin/sellers/:id
exports.removeSeller = async (req, res) => {
  try {
    const { id } = req.params;
    // Cascade delete will remove products due to FK cascade in schema
    const deleted = await db.delete(users).where(eq(users.id, id));
    res.json({ success: true, message: "Seller removed" });
  } catch (error) {
    console.error("Remove seller error:", error);
    res.status(500).json({
      success: false,
      message: "Error removing seller",
      error: error.message,
    });
  }
};

// POST /api/admin/sellers
exports.createSeller = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      companyName,
      vendorName,
      isActive = true,
    } = req.body;

    if (
      !email ||
      !password ||
      !firstName ||
      !lastName ||
      !phone ||
      !companyName
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const id = nanoid();

    const [created] = await db
      .insert(users)
      .values({
        id,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: "seller",
        firstName,
        lastName,
        phone,
        companyName,
        vendorName: vendorName || companyName,
        isActive: !!isActive,
        isEmailVerified: false,
      })
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
      });

    res
      .status(201)
      .json({ success: true, message: "Seller created", data: created });
  } catch (error) {
    console.error("Create seller error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating seller",
      error: error.message,
    });
  }
};

// Sub-Admin Management

// POST /api/admin/subadmins - Create sub-admin
exports.createSubAdmin = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Check if email exists
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = nanoid();

    const [created] = await db
      .insert(users)
      .values({
        id,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: "subadmin",
        firstName: firstName || null,
        lastName: lastName || null,
        phone: phone || null,
        isActive: true,
        isEmailVerified: true,
      })
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        isActive: users.isActive,
        createdAt: users.createdAt,
      });

    res.status(201).json({
      success: true,
      message: "Sub-admin created successfully",
      data: created,
    });
  } catch (error) {
    console.error("Create sub-admin error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating sub-admin",
      error: error.message,
    });
  }
};

// GET /api/admin/subadmins - List all sub-admins
exports.listSubAdmins = async (req, res) => {
  try {
    const subAdmins = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.role, "subadmin"));

    res.json({ success: true, data: subAdmins });
  } catch (error) {
    console.error("List sub-admins error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching sub-admins",
      error: error.message,
    });
  }
};

// DELETE /api/admin/subadmins/:id - Remove sub-admin
exports.deleteSubAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if sub-admin exists
    const [subAdmin] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!subAdmin) {
      return res.status(404).json({
        success: false,
        message: "Sub-admin not found",
      });
    }

    if (subAdmin.role !== "subadmin") {
      return res.status(400).json({
        success: false,
        message: "User is not a sub-admin",
      });
    }

    await db.delete(users).where(eq(users.id, id));

    res.json({
      success: true,
      message: "Sub-admin deleted successfully",
    });
  } catch (error) {
    console.error("Delete sub-admin error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting sub-admin",
      error: error.message,
    });
  }
};
