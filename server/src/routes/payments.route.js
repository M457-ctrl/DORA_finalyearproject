/**
 * Payment Routes - eSewa Payment Gateway
 */

const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const {
  generateEsewaHash,
  verifyEsewaPayment,
  getPaymentStatus,
} = require("../controllers/payments.controller");

/**
 * POST /api/payments/esewa/hash
 * Generate eSewa payment hash for frontend redirection
 * Public endpoint (called from frontend during checkout)
 */
router.post("/esewa/hash", generateEsewaHash);

/**
 * POST /api/payments/esewa/verify
 * Verify eSewa payment after user completes transaction
 * Public endpoint (called from frontend redirect callback)
 */
router.post("/esewa/verify", verifyEsewaPayment);

/**
 * GET /api/payments/status/:orderId
 * Get payment status for a specific order
 * Protected endpoint (requires authentication)
 */
router.get("/status/:orderId", authenticate, getPaymentStatus);

module.exports = router;
