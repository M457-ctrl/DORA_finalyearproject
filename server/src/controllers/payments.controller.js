/**
 * Payments Controller - Khalti Payment Gateway Integration
 *
 * Handles:
 * 1. Khalti payment initiation (returns hosted checkout URL)
 * 2. Khalti payment verification via lookup API
 * 3. Payment status tracking from local orders table
 */

const { db } = require("../config/db");
const { orders } = require("../models/orders");
const { products } = require("../models/products");
const { eq } = require("drizzle-orm");

const DEFAULT_CLIENT_URL = "http://localhost:5173";

const KHALTI_CONFIG = {
  mode: process.env.NODE_ENV === "production" ? "PRODUCTION" : "TEST",
  testBaseUrl: "https://dev.khalti.com/api/v2",
  productionBaseUrl: "https://khalti.com/api/v2",
  secretKey:
    process.env.KHALTI_SECRET_KEY ||
    process.env.KHALTI_LIVE_SECRET_KEY ||
    process.env.KHALTI_TEST_SECRET_KEY ||
    "",
};

const getKhaltiBaseUrl = () =>
  KHALTI_CONFIG.mode === "PRODUCTION"
    ? KHALTI_CONFIG.productionBaseUrl
    : KHALTI_CONFIG.testBaseUrl;

const postToKhalti = async (path, payload) => {
  if (!KHALTI_CONFIG.secretKey) {
    const configError = new Error(
      "Khalti is not configured. Set KHALTI_SECRET_KEY in server/.env",
    );
    configError.statusCode = 500;
    throw configError;
  }

  const response = await fetch(`${getKhaltiBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${KHALTI_CONFIG.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage =
      result?.detail ||
      result?.message ||
      result?.error_key ||
      `Khalti API request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return result;
};

// POST /api/payments/khalti/initiate
exports.initiateKhaltiPayment = async (req, res) => {
  try {
    const { productId, quantity, discountPercent = 0, notes } = req.body;
    const buyerId = req.user.userId;

    if (!productId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "productId and quantity required",
      });
    }

    const qty = parseInt(quantity, 10);
    const discount = parseInt(discountPercent, 10) || 0;
    if (Number.isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive number",
      });
    }

    const [product] = await db
      .select({
        id: products.id,
        sellerId: products.sellerId,
        cropName: products.cropName,
        quantity: products.quantity,
        minPriceExpected: products.minPriceExpected,
        currentPrice: products.currentPrice,
        isAvailable: products.isAvailable,
      })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!product.isAvailable || product.quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Product not available",
      });
    }

    if (qty > product.quantity) {
      return res.status(400).json({
        success: false,
        message: "Requested quantity exceeds available stock",
      });
    }

    const unitPrice = Number(product.currentPrice || product.minPriceExpected);
    const gross = unitPrice * qty;
    const totalAmountRupees = +(gross * (1 - discount / 100)).toFixed(2);
    const totalAmountPaisa = Math.round(totalAmountRupees * 100);

    if (totalAmountPaisa < 1000) {
      return res.status(400).json({
        success: false,
        message: "Khalti minimum payable amount is Rs. 10",
      });
    }

    const productNameSlug = product.cropName.toLowerCase().replace(/\s+/g, "-");
    const orderId = `${productNameSlug}-${Math.floor(Math.random() * 10000)}`;

    const clientUrl = process.env.CLIENT_URL || DEFAULT_CLIENT_URL;
    const websiteUrl = process.env.WEBSITE_URL || clientUrl;

    const initiatePayload = {
      return_url: `${clientUrl}/payment/success`,
      website_url: websiteUrl,
      amount: totalAmountPaisa,
      purchase_order_id: orderId,
      purchase_order_name: product.cropName,
      customer_info: {
        name: req.user.email || "Buyer",
        email: req.user.email || "buyer@example.com",
      },
    };

    const khaltiResponse = await postToKhalti(
      "/epayment/initiate/",
      initiatePayload,
    );

    const {
      pidx,
      payment_url: paymentUrl,
      expires_at: expiresAt,
      expires_in: expiresIn,
    } = khaltiResponse;

    if (!pidx || !paymentUrl) {
      return res.status(500).json({
        success: false,
        message: "Khalti initiation response missing required fields",
      });
    }

    await db.insert(orders).values({
      id: orderId,
      productId: product.id,
      sellerId: product.sellerId,
      buyerId,
      quantity: qty,
      unitPrice: unitPrice.toFixed(2),
      discountPercent: discount,
      totalPrice: totalAmountRupees.toFixed(2),
      status: "pending",
      paymentMethod: "khalti",
      paymentCode: pidx,
      paymentStatus: "pending",
      notes: notes || null,
    });

    // Keep stock reservation behavior aligned with the existing checkout implementation.
    await db
      .update(products)
      .set({
        quantity: product.quantity - qty,
        isAvailable: product.quantity - qty > 0,
        updatedAt: new Date(),
      })
      .where(eq(products.id, product.id));

    res.json({
      success: true,
      message: "Khalti payment initiated",
      data: {
        khaltiData: {
          pidx,
          paymentUrl,
          expiresAt,
          expiresIn,
          totalAmount: totalAmountRupees,
          amount: totalAmountPaisa,
          returnUrl: `${clientUrl}/payment/success`,
        },
      },
    });
  } catch (error) {
    console.error("Khalti initiate error:", error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message:
        statusCode === 500 &&
        typeof error.message === "string" &&
        error.message.includes("Khalti is not configured")
          ? error.message
          : "Error initiating Khalti payment",
      error: error.message,
    });
  }
};

// POST /api/payments/khalti/verify
exports.verifyKhaltiPayment = async (req, res) => {
  try {
    const { pidx } = req.body;

    if (!pidx) {
      return res.status(400).json({
        success: false,
        message: "pidx is required for payment verification",
      });
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.paymentCode, pidx))
      .limit(1);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found for provided payment reference",
      });
    }

    if (order.paymentStatus === "completed") {
      return res.json({
        success: true,
        message: "Payment already verified",
        data: {
          orderId: order.id,
          totalPrice: Number(order.totalPrice),
          paymentCode: order.paymentCode,
          transactionId: order.transactionId || order.paymentCode,
        },
      });
    }

    const lookupResponse = await postToKhalti("/epayment/lookup/", { pidx });

    if (lookupResponse.status !== "Completed") {
      return res.status(400).json({
        success: false,
        message: `Payment not completed. Current status: ${lookupResponse.status}`,
      });
    }

    const orderAmountPaisa = Math.round(Number(order.totalPrice) * 100);
    const khaltiAmount = Number(lookupResponse.total_amount || 0);
    if (khaltiAmount && khaltiAmount !== orderAmountPaisa) {
      return res.status(400).json({
        success: false,
        message: "Amount mismatch. Payment verification failed.",
      });
    }

    const transactionId =
      lookupResponse.transaction_id || lookupResponse.tidx || order.paymentCode;

    await db
      .update(orders)
      .set({
        paymentStatus: "completed",
        transactionId,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    res.json({
      success: true,
      message: "Payment verified successfully",
      data: {
        orderId: order.id,
        totalPrice: Number(order.totalPrice),
        paymentCode: order.paymentCode,
        transactionId,
      },
    });
  } catch (error) {
    console.error("Khalti verify error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying Khalti payment",
      error: error.message,
    });
  }
};

/**
 * Get Payment Status for an Order
 */
exports.getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const [order] = await db
      .select({
        paymentMethod: orders.paymentMethod,
        paymentCode: orders.paymentCode,
        paymentStatus: orders.paymentStatus,
        transactionId: orders.transactionId,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Get payment status error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching payment status",
      error: error.message,
    });
  }
};
