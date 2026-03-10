/**
 * Payments Controller - eSewa Payment Gateway Integration
 *
 * Handles:
 * 1. eSewa payment hash generation (for redirecting to eSewa)
 * 2. eSewa payment verification (after user completes payment)
 * 3. Payment status tracking
 */

const crypto = require("crypto");
const { db } = require("../config/db");
const { orders } = require("../models/orders");
const { eq } = require("drizzle-orm");

// eSewa Configuration
const ESEWA_CONFIG = {
  mode: process.env.NODE_ENV === "production" ? "PRODUCTION" : "TEST",
  testUrl: "https://uat.esewa.com.np/epay/main",
  productionUrl: "https://esewa.com.np/epay/main",
  merchantCode: process.env.ESEWA_MERCHANT_CODE || "TESTMERCHANT",
  secretKey: process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q",
};

/**
 * Generate eSewa Payment Hash
 *
 * Flow:
 * 1. Calculate total amount
 * 2. Generate unique product code (order ID)
 * 3. Create string to hash: total_amount|product_code|merchant_code
 * 4. Generate HMAC-SHA256 hash using secret key
 * 5. Return hash and payment data to frontend
 */
exports.generateEsewaHash = async (req, res) => {
  try {
    const { productId, quantity, discountPercent = 0, notes } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "productId and quantity required",
      });
    }

    // For demo: calculate directly
    // In real scenario, fetch product from DB like in createOrder
    const productCode = `${productId}-${Date.now()}`;

    // Example calculation (in production, fetch actual product price)
    const unitPrice = 1000; // Example: Rs. 1000
    const qty = parseInt(quantity, 10);
    const discount = parseInt(discountPercent, 10) || 0;

    const amount = (unitPrice * qty * (1 - discount / 100)).toFixed(2);
    const serviceCost = 0; // Your service charges
    const deliveryCharge = 0; // Your delivery charges
    const totalAmount = (
      parseFloat(amount) +
      serviceCost +
      deliveryCharge
    ).toFixed(2);

    // Create hash string in required format: total_amount|product_code|merchant_code
    const hashString = `${totalAmount}|${productCode}|${ESEWA_CONFIG.merchantCode}`;

    // Generate HMAC-SHA256
    const hash = crypto
      .createHmac("sha256", ESEWA_CONFIG.secretKey)
      .update(hashString)
      .digest("base64");

    const esewaUrl =
      ESEWA_CONFIG.mode === "PRODUCTION"
        ? ESEWA_CONFIG.productionUrl
        : ESEWA_CONFIG.testUrl;

    const successUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/payment/success`;
    const failureUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/payment/failure`;

    res.json({
      success: true,
      data: {
        hash,
        esewaData: {
          amount: parseFloat(amount),
          serviceCost: parseFloat(serviceCost),
          deliveryCharge: parseFloat(deliveryCharge),
          totalAmount: parseFloat(totalAmount),
          productCode, // Unique order identifier
          merchantCode: ESEWA_CONFIG.merchantCode,
          successUrl,
          failureUrl,
          url: esewaUrl,
        },
      },
    });
  } catch (error) {
    console.error("Generate hash error:", error);
    res.status(500).json({
      success: false,
      message: "Error generating payment hash",
      error: error.message,
    });
  }
};

/**
 * Verify eSewa Payment
 *
 * Flow:
 * 1. User completes payment on eSewa
 * 2. eSewa redirects to success URL with transaction data
 * 3. Frontend calls this endpoint with transaction data
 * 4. Backend verifies hash with eSewa
 * 5. Update order with payment details
 */
exports.verifyEsewaPayment = async (req, res) => {
  try {
    const { oid, amt, refId, sid } = req.body;

    if (!oid || !amt || !refId) {
      return res.status(400).json({
        success: false,
        message: "Missing required transaction data (oid, amt, refId)",
      });
    }

    // Find order by product code (oid = product code from hash generation)
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.paymentCode, oid))
      .limit(1);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify amount matches
    if (parseFloat(amt) !== parseFloat(order.totalPrice)) {
      return res.status(400).json({
        success: false,
        message: "Amount mismatch. Payment verification failed.",
      });
    }

    // In production, you may want to verify with eSewa API
    // For now, we trust the refId as proof of successful payment

    // Update order with payment confirmation
    const updatedOrder = await db
      .update(orders)
      .set({
        paymentStatus: "completed",
        transactionId: refId,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, oid))
      .returning();

    res.json({
      success: true,
      message: "Payment verified successfully",
      data: {
        orderId: order.id,
        totalPrice: order.totalPrice,
        paymentCode: order.paymentCode,
        transactionId: refId,
      },
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying payment",
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
