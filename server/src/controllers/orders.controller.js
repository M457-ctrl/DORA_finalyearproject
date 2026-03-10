const { db } = require("../config/db");
const { orders } = require("../models/orders");
const { products } = require("../models/products");
const { users } = require("../models/users");
const { eq } = require("drizzle-orm");
const { nanoid } = require("nanoid");

// POST /api/orders - buyer places order
exports.createOrder = async (req, res) => {
  try {
    const buyerId = req.user.userId;
    const {
      productId,
      quantity,
      discountPercent = 0,
      notes,
      paymentMethod = "cod",
      paymentCode,
    } = req.body;

    if (!productId || !quantity) {
      return res
        .status(400)
        .json({ success: false, message: "productId and quantity required" });
    }

    const qty = parseInt(quantity, 10);
    const discount = parseInt(discountPercent, 10) || 0;
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive number",
      });
    }
    if (discount < 0 || discount > 90) {
      return res
        .status(400)
        .json({ success: false, message: "Discount must be between 0 and 90" });
    }

    // Validate payment method
    if (!["cod", "esewa"].includes(paymentMethod)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment method" });
    }

    const [product] = await db
      .select({
        id: products.id,
        sellerId: products.sellerId,
        cropName: products.cropName,
        quantity: products.quantity,
        minPriceExpected: products.minPriceExpected,
        maxPriceExpected: products.maxPriceExpected,
        currentPrice: products.currentPrice,
        isAvailable: products.isAvailable,
      })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    if (!product.isAvailable || product.quantity <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Product not available" });
    }
    if (qty > product.quantity) {
      return res.status(400).json({
        success: false,
        message: "Requested quantity exceeds available stock",
      });
    }

    const unitPrice = Number(product.currentPrice || product.minPriceExpected);
    const gross = unitPrice * qty;
    const totalPrice = +(gross * (1 - discount / 100)).toFixed(2);

    // Generate custom order ID: productname-randomnumber
    const productNameSlug = product.cropName.toLowerCase().replace(/\s+/g, "-");
    const randomNum = Math.floor(Math.random() * 10000);
    const id = `${productNameSlug}-${randomNum}`;

    // Generate payment code if not provided (for COD)
    const finalPaymentCode =
      paymentCode ||
      (paymentMethod === "cod" ? `COD-${Date.now()}` : `ESEWA-${Date.now()}`);

    // For COD, mark payment as pending. For eSewa, payment will be verified later
    const paymentStatus = paymentMethod === "cod" ? "pending" : "pending";

    const [created] = await db
      .insert(orders)
      .values({
        id,
        productId: product.id,
        sellerId: product.sellerId,
        buyerId,
        quantity: qty,
        unitPrice: unitPrice.toFixed(2),
        discountPercent: discount,
        totalPrice: totalPrice.toFixed(2),
        status: "pending",
        paymentMethod,
        paymentCode: finalPaymentCode,
        paymentStatus,
        notes: notes || null,
      })
      .returning({ id: orders.id });

    // Reduce product stock and availability
    const remaining = product.quantity - qty;
    await db
      .update(products)
      .set({
        quantity: remaining,
        isAvailable: remaining > 0,
        updatedAt: new Date(),
      })
      .where(eq(products.id, product.id));

    res.status(201).json({
      success: true,
      message: "Order placed",
      data: {
        id,
        totalPrice,
        paymentMethod,
        paymentCode: finalPaymentCode,
      },
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({
      success: false,
      message: "Error placing order",
      error: error.message,
    });
  }
};

// GET /api/orders/seller/my - seller's orders
exports.getMySellerOrders = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const rows = await db
      .select({
        id: orders.id,
        productId: orders.productId,
        productName: products.cropName,
        buyerId: orders.buyerId,
        buyerName: users.firstName,
        buyerEmail: users.email,
        quantity: orders.quantity,
        unitPrice: orders.unitPrice,
        discountPercent: orders.discountPercent,
        totalPrice: orders.totalPrice,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        paymentCode: orders.paymentCode,
        paymentStatus: orders.paymentStatus,
        notes: orders.notes,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .leftJoin(products, eq(orders.productId, products.id))
      .leftJoin(users, eq(orders.buyerId, users.id))
      .where(eq(orders.sellerId, sellerId));

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Seller orders error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message,
    });
  }
};

// GET /api/orders/buyer/my - buyer's orders
exports.getMyBuyerOrders = async (req, res) => {
  try {
    const buyerId = req.user.userId;
    const rows = await db
      .select({
        id: orders.id,
        productId: orders.productId,
        sellerId: orders.sellerId,
        quantity: orders.quantity,
        unitPrice: orders.unitPrice,
        discountPercent: orders.discountPercent,
        totalPrice: orders.totalPrice,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        paymentCode: orders.paymentCode,
        paymentStatus: orders.paymentStatus,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.buyerId, buyerId));

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Buyer orders error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message,
    });
  }
};

// PUT /api/orders/:orderId/status - seller updates order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "verified",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // Check if order exists and belongs to this seller
    const [order] = await db
      .select({ id: orders.id, sellerId: orders.sellerId })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.sellerId !== sellerId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Update status
    await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    res.json({
      success: true,
      message: "Order status updated",
      data: { status },
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating order status",
      error: error.message,
    });
  }
};
