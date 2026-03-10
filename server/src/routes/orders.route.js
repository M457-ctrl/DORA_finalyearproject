const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const {
  createOrder,
  getMySellerOrders,
  getMyBuyerOrders,
  updateOrderStatus,
} = require("../controllers/orders.controller");

// Buyer places an order
router.post("/", authenticate, authorize("buyer"), createOrder);

// Seller views their orders
router.get("/seller/my", authenticate, authorize("seller"), getMySellerOrders);

// Buyer views their orders
router.get("/buyer/my", authenticate, authorize("buyer"), getMyBuyerOrders);

// Seller updates order status
router.put(
  "/:orderId/status",
  authenticate,
  authorize("seller"),
  updateOrderStatus
);

module.exports = router;
