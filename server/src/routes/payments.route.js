/**
 * Payment Routes - Khalti Payment Gateway
 */

const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const {
  initiateKhaltiPayment,
  verifyKhaltiPayment,
  getPaymentStatus,
} = require("../controllers/payments.controller");

/**
 * POST /api/payments/khalti/initiate
 * Initiate Khalti payment and return hosted checkout URL
 * Protected endpoint because it prepares a pending order
 */
router.post(
  "/khalti/initiate",
  authenticate,
  authorize("buyer"),
  initiateKhaltiPayment,
);

/**
 * POST /api/payments/khalti/verify
 * Verify Khalti payment after user completes transaction
 * Public endpoint (called from frontend redirect callback)
 */
router.post("/khalti/verify", verifyKhaltiPayment);

/**
 * GET /api/payments/status/:orderId
 * Get payment status for a specific order
 * Protected endpoint (requires authentication)
 */
router.get("/status/:orderId", authenticate, getPaymentStatus);

module.exports = router;
