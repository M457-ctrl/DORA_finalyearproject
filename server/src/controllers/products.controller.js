const { v4: uuidv4 } = require("uuid");
const { db } = require("../config/db");
const { products } = require("../models/products");
const { eq, sql } = require("drizzle-orm");

/**
 * Create a new product listing
 * @param {Object} productData - Product data
 * @returns {Object} Created product
 */
exports.createProduct = async (req, res) => {
  try {
    const {
      cropName,
      description,
      category,
      quantity,
      unit,
      minPriceExpected,
      maxPriceExpected,
      currentPrice,
      discountPercent,
      imageUrl,
      harvestDate,
      expiryDate,
      location,
    } = req.body;
    const sellerId = req.user?.userId || req.user?.id;

    console.log("Create product request:", {
      sellerId,
      user: req.user,
      body: req.body,
    });

    // Validation
    if (
      !cropName ||
      !category ||
      !quantity ||
      !minPriceExpected ||
      !maxPriceExpected
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: cropName, category, quantity, minPriceExpected, maxPriceExpected",
      });
    }

    if (!sellerId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in request",
      });
    }

    if (minPriceExpected > maxPriceExpected) {
      return res.status(400).json({
        success: false,
        message: "Minimum price cannot be greater than maximum price",
      });
    }

    const productId = uuidv4();
    const newProduct = await db
      .insert(products)
      .values({
        id: productId,
        sellerId,
        cropName,
        description: description || "",
        category,
        quantity: parseFloat(quantity),
        unit: unit || "kg",
        minPriceExpected: parseFloat(minPriceExpected),
        maxPriceExpected: parseFloat(maxPriceExpected),
        currentPrice: currentPrice ? parseFloat(currentPrice) : null,
        discountPercent: discountPercent ? parseInt(discountPercent, 10) : 0,
        imageUrl,
        harvestDate: harvestDate ? new Date(harvestDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        location: location || "",
      })
      .returning();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: newProduct[0],
    });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating product",
      error: error.message,
    });
  }
};

/**
 * Get all products with optional filtering
 * @param {Object} query - Query parameters (category, minPrice, maxPrice, search)
 * @returns {Array} List of products
 */
exports.getAllProducts = async (req, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      search,
      page = 1,
      limit = 12,
    } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const normalizeProductRow = (row) => ({
      id: row.id,
      sellerId: row.seller_id ?? row.sellerId,
      cropName: row.crop_name ?? row.cropName,
      description: row.description ?? "",
      category: row.category,
      quantity: Number(row.quantity ?? 0),
      unit: row.unit ?? "kg",
      minPriceExpected: Number(row.min_price_expected ?? row.minPriceExpected),
      maxPriceExpected: Number(row.max_price_expected ?? row.maxPriceExpected),
      currentPrice: row.current_price ?? row.currentPrice ?? null,
      discountPercent: Number(row.discount_percent ?? row.discountPercent ?? 0),
      imageUrl: row.image_url ?? row.imageUrl ?? null,
      harvestDate: row.harvest_date ?? row.harvestDate ?? null,
      expiryDate: row.expiry_date ?? row.expiryDate ?? null,
      location: row.location ?? "",
      isSeasonal: row.is_seasonal ?? row.isSeasonal ?? false,
      isAvailable: row.is_available ?? row.isAvailable ?? true,
      viewCount: Number(row.view_count ?? row.viewCount ?? 0),
      createdAt: row.created_at ?? row.createdAt,
      updatedAt: row.updated_at ?? row.updatedAt,
    });

    let rows = [];
    try {
      const result = await db.execute(
        sql`SELECT * FROM products WHERE is_available = true`,
      );
      rows = result?.rows ?? result ?? [];
    } catch (queryError) {
      // Fallback for schemas missing is_available or other columns
      try {
        const fallbackResult = await db.execute(sql`SELECT * FROM products`);
        rows = fallbackResult?.rows ?? fallbackResult ?? [];
      } catch (fallbackError) {
        console.error("Get all products fallback error:", fallbackError);
        return res.json({
          success: true,
          data: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0,
          },
        });
      }
    }

    const allProducts = rows.map(normalizeProductRow);

    // Apply search and price filters in JavaScript
    let filtered = allProducts;
    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.cropName?.toLowerCase().includes(search.toLowerCase()) ||
          p.description?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (minPrice) {
      filtered = filtered.filter(
        (p) => parseFloat(p.minPriceExpected) >= parseFloat(minPrice),
      );
    }

    if (maxPrice) {
      filtered = filtered.filter(
        (p) => parseFloat(p.maxPriceExpected) <= parseFloat(maxPrice),
      );
    }

    // Apply pagination
    const total = filtered.length;
    const paginatedProducts = filtered.slice(offset, offset + limit);

    res.json({
      success: true,
      data: paginatedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get all products error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
};

/**
 * Get a single product by ID
 * @param {string} productId - Product ID
 * @returns {Object} Product details
 */
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await db.select().from(products).where(eq(products.id, id));

    if (!product || product.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Increment view count
    await db
      .update(products)
      .set({ viewCount: sql`${products.viewCount} + 1` })
      .where(eq(products.id, id));

    res.json({
      success: true,
      data: product[0],
    });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching product",
      error: error.message,
    });
  }
};

/**
 * Get all products by seller
 * @param {string} sellerId - Seller ID
 * @returns {Array} List of seller's products
 */
exports.getProductsBySeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    const allProducts = await db
      .select()
      .from(products)
      .where(eq(products.sellerId, sellerId));

    const total = allProducts.length;
    const paginatedProducts = allProducts.slice(offset, offset + limit);

    res.json({
      success: true,
      data: paginatedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get seller products error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching seller products",
      error: error.message,
    });
  }
};

/**
 * Get current user's products
 * @returns {Array} List of current user's products
 */
exports.getMyProducts = async (req, res) => {
  try {
    const sellerId = req.user?.userId || req.user?.id;
    const { page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    if (!sellerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const allProducts = await db
      .select()
      .from(products)
      .where(eq(products.sellerId, sellerId));

    const total = allProducts.length;
    const paginatedProducts = allProducts.slice(offset, offset + limit);

    res.json({
      success: true,
      data: paginatedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get my products error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching your products",
      error: error.message,
    });
  }
};

/**
 * Update a product
 * @param {string} productId - Product ID
 * @returns {Object} Updated product
 */
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user?.userId || req.user?.id;
    const updates = req.body;

    // Check if product exists and belongs to user
    const product = await db.select().from(products).where(eq(products.id, id));

    if (!product || product.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product[0].sellerId !== sellerId) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own products",
      });
    }

    // Convert date strings to Date objects if present
    const processedUpdates = { ...updates };
    if (updates.harvestDate && typeof updates.harvestDate === "string") {
      processedUpdates.harvestDate = new Date(updates.harvestDate);
    }
    if (updates.expiryDate && typeof updates.expiryDate === "string") {
      processedUpdates.expiryDate = new Date(updates.expiryDate);
    }

    // Update the product
    const updatedProduct = await db
      .update(products)
      .set({
        ...processedUpdates,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    res.json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct[0],
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating product",
      error: error.message,
    });
  }
};

/**
 * Delete a product
 * @param {string} productId - Product ID
 * @returns {Object} Success message
 */
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user?.userId || req.user?.id;

    // Check if product exists and belongs to user
    const product = await db.select().from(products).where(eq(products.id, id));

    if (!product || product.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product[0].sellerId !== sellerId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own products",
      });
    }

    await db.delete(products).where(eq(products.id, id));

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting product",
      error: error.message,
    });
  }
};

/**
 * Get product categories
 * @returns {Array} List of unique categories
 */
exports.getCategories = async (req, res) => {
  try {
    // Predefined agricultural categories
    const predefinedCategories = [
      "Vegetables",
      "Fruits",
      "Seasonal Fruits",
      "Dried Fruits",
      "Grains",
      "Pulses",
      "Spices",
      "Dairy",
      "Organic",
      "Seeds",
      "Fertilizers",
      "Equipment",
      "Other",
    ];

    try {
      // Try to get categories from existing products
      const allProducts = await db.select().from(products);
      const productCategories = [
        ...new Set(allProducts.map((p) => p.category)),
      ];

      // Combine and sort unique categories
      const allCategories = [
        ...new Set([...predefinedCategories, ...productCategories]),
      ].sort();

      return res.json({
        success: true,
        data: allCategories,
      });
    } catch (dbError) {
      // If products table doesn't exist yet, just return predefined categories
      console.log(
        "Products table not available, returning predefined categories",
      );
      return res.json({
        success: true,
        data: predefinedCategories,
      });
    }
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message,
    });
  }
};
