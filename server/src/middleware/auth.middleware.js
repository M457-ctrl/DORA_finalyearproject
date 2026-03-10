const jwt = require("jsonwebtoken");
const { db } = require("../config/db");
const { users } = require("../models/users");
const { eq } = require("drizzle-orm");

const authenticate = async (req, res, next) => {
  try {
    // ---- GET TOKEN FROM HEADER ----
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message:
          "No token provided. Authorization header must be in format: Bearer <token>",
      });
    }

    // Remove "Bearer " prefix from token
    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    // ---- VERIFY TOKEN ----
    // jwt.verify will throw error if token is invalid or expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ---- CHECK IF USER STILL EXISTS ----
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // ---- CHECK IF ACCOUNT IS ACTIVE ----
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // ---- ATTACH USER INFO TO REQUEST ----
    // Now controllers can access req.user to get logged-in user info
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    // ---- PROCEED TO NEXT MIDDLEWARE/CONTROLLER ----
    next();
  } catch (error) {
    // ---- HANDLE JWT ERRORS ----
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    // ---- HANDLE OTHER ERRORS ----
    console.error("Authentication error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // ---- CHECK IF USER IS AUTHENTICATED ----
    // authenticate middleware must run first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userRole = req.user.role;

    // Flatten allowedRoles in case an array is passed
    const rolesArray = allowedRoles.flat();

    // ---- ADMINS CAN ACCESS EVERYTHING ----
    if (userRole === "admin") {
      return next();
    }

    // ---- CHECK IF USER'S ROLE IS IN ALLOWED ROLES ----
    if (rolesArray.includes(userRole)) {
      return next();
    }

    // ---- ROLE NOT ALLOWED ----
    console.log("Authorization denied:", {
      userRole,
      allowedRoles: rolesArray,
    });
    res.status(403).json({
      success: false,
      message: "Access denied. Insufficient permissions",
    });
  };
};

const requireAdmin = authorize("admin");

const requireSubAdmin = authorize("subadmin");

const requireSeller = authorize("seller");

const requireBuyer = authorize("buyer");

const requireCooperative = authorize("cooperative");

const requireBuyerOrCooperative = authorize("buyer", "cooperative");

// ============ EXPORT MIDDLEWARE ============
module.exports = {
  authenticate,
  authorize,
  requireAdmin,
  requireSubAdmin,
  requireSeller,
  requireBuyer,
  requireCooperative,
  requireBuyerOrCooperative,
};
