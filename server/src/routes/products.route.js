const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const {
  createProduct,
  getAllProducts,
  getProductById,
  getProductsBySeller,
  getMyProducts,
  updateProduct,
  deleteProduct,
  getCategories,
} = require("../controllers/products.controller");

/**
 * Public routes - Anyone can access
 */

// Get all products
router.get("/", getAllProducts);

// Get product categories (must come before /:id to avoid being caught by wildcard)
router.get("/categories", getCategories);

/**
 * Protected routes - Only authenticated users
 */

// Get current user's products (must come before /:id and /seller/:sellerId to avoid being caught by wildcard)
router.get("/my-products", authenticate, getMyProducts);

/**
 * Public routes (continued)
 */

// Get all products by a specific seller (must come before /:id to avoid being caught by wildcard)
router.get("/seller/:sellerId", getProductsBySeller);

// Get single product by ID (must be last since it catches all :id patterns)
router.get("/:id", getProductById);

// Create a new product (only sellers)
router.post("/", authenticate, authorize("seller"), createProduct);

// Update a product (only product owner)
router.put("/:id", authenticate, updateProduct);

// Delete a product (only product owner)
router.delete("/:id", authenticate, deleteProduct);

module.exports = router;
