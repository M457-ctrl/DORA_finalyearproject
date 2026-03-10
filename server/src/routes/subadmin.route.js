const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { listSellers, getSeller } = require("../controllers/admin.controller");

// All subadmin routes require subadmin role
router.use(authenticate, authorize("subadmin"));

// Sellers management - READ ONLY for subadmin
// SubAdmins can only view sellers, not modify them
router.get("/sellers", listSellers);
router.get("/sellers/:id", getSeller);

module.exports = router;
