const express = require("express");
const router = express.Router();
const {
  authenticate,
  requireAdmin,
  requireBuyer,
  requireCooperative,
  requireBuyerOrCooperative,
} = require("../middleware/auth.middleware");

// Example route - accessible to all authenticated users
router.get("/protected", authenticate, (req, res) => {
  res.json({
    success: true,
    message: "This is a protected route",
    user: req.user,
  });
});

// Example route - admin only
router.get("/admin-only", authenticate, requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: "This route is accessible only to admins",
    user: req.user,
  });
});

// Example route - buyer only
router.get("/buyer-only", authenticate, requireBuyer, (req, res) => {
  res.json({
    success: true,
    message: "This route is accessible only to buyers",
    user: req.user,
  });
});

// Example route - cooperative only
router.get("/cooperative-only", authenticate, requireCooperative, (req, res) => {
  res.json({
    success: true,
    message: "This route is accessible only to cooperatives",
    user: req.user,
  });
});

// Example route - buyer or cooperative (same level)
router.get("/user-only", authenticate, requireBuyerOrCooperative, (req, res) => {
  res.json({
    success: true,
    message: "This route is accessible to buyers and cooperatives",
    user: req.user,
  });
});

module.exports = router;



