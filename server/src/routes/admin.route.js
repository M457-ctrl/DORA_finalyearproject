const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const {
  listSellers,
  getSeller,
  approveSeller,
  deactivateSeller,
  removeSeller,
  createSeller,
  createSubAdmin,
  listSubAdmins,
  deleteSubAdmin,
} = require("../controllers/admin.controller");

// All admin routes require admin role
router.use(authenticate, authorize("admin"));

// Sellers management
router.get("/sellers", listSellers);
router.get("/sellers/:id", getSeller);
router.post("/sellers", createSeller);
router.patch("/sellers/:id/approve", approveSeller);
router.patch("/sellers/:id/deactivate", deactivateSeller);
router.delete("/sellers/:id", removeSeller);

// Sub-admins management
router.post("/subadmins", createSubAdmin);
router.get("/subadmins", listSubAdmins);
router.delete("/subadmins/:id", deleteSubAdmin);

module.exports = router;
