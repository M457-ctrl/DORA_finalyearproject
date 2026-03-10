const express = require("express");
const router = express.Router();

// ============ IMPORTS ============
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.post("/register", register);

router.post("/login", login);

router.get("/profile", authenticate, getProfile);

router.put("/profile", authenticate, updateProfile);

router.put("/change-password", authenticate, changePassword);

// ============ EXPORT ROUTER ============
module.exports = router;


