const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../config/db");
const { users } = require("../models/users");
const { eq } = require("drizzle-orm");
const { nanoid } = require("nanoid");

// ============ HELPER FUNCTION ============
/**
 * Generate JWT token for a user
 * @param {string} userId - User ID
 * @param {string} role - User role (admin, buyer, cooperative)
 * @returns {string} JWT token
 */
const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const register = async (req, res) => {
  try {
    const {
      email,
      password,
      role,
      firstName,
      lastName,
      phone,
      companyName,
      vendorName,
    } = req.body;

    // ---- INPUT VALIDATION ----
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "First name and last name are required",
      });
    }

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // Only allow 'buyer' or 'seller' roles
    // Admins must be created manually via create-admin.js script
    const allowedRoles = ["buyer", "seller"];
    const userRole =
      role && allowedRoles.includes(role.toLowerCase())
        ? role.toLowerCase()
        : "buyer"; // Default to buyer if not specified

    // Validate seller-specific fields
    if (userRole === "seller" && !companyName) {
      return res.status(400).json({
        success: false,
        message: "Company name is required for seller registration",
      });
    }

    // ---- CHECK IF USER EXISTS ----
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // ---- HASH PASSWORD ----
    // bcrypt with salt rounds = 12 (more secure but slower)
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // ---- CREATE NEW USER ----
    const userId = nanoid(); // Generate unique ID
    const newUser = {
      id: userId,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: userRole,
      firstName: firstName,
      lastName: lastName,
      phone: phone,
      companyName: userRole === "seller" ? companyName : null,
      vendorName: userRole === "seller" ? vendorName || companyName : null,
      // Seller accounts require admin approval; buyers active by default
      isActive: userRole === "seller" ? false : true,
      isEmailVerified: false, // Email verification not implemented yet
    };

    // Insert user into database and return selected fields only
    const [createdUser] = await db.insert(users).values(newUser).returning({
      id: users.id,
      email: users.email,
      role: users.role,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      companyName: users.companyName,
      vendorName: users.vendorName,
      isActive: users.isActive,
      isEmailVerified: users.isEmailVerified,
      createdAt: users.createdAt,
    });

    // ---- GENERATE TOKEN ----
    const token = generateToken(createdUser.id, createdUser.role);

    // ---- SEND RESPONSE ----
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: createdUser,
        token, // User is automatically logged in after registration
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ---- INPUT VALIDATION ----
    if (!email || !password) {
      console.log("❌ Login failed: Missing email or password");
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    console.log(`🔐 Login attempt for email: ${email}`);

    // ---- FIND USER BY EMAIL ----
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      // Don't reveal if email exists for security
      console.log(`❌ Login failed: User not found for ${email}`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // ---- CHECK IF ACCOUNT IS ACTIVE ----
    if (!user.isActive) {
      console.log(
        `❌ Login failed: Account inactive for ${email} (${user.role})`,
      );

      // Provide specific message for sellers pending approval
      const message =
        user.role === "seller"
          ? "Your seller account is pending admin approval. You will be able to login once an administrator approves your account."
          : "Your account has been deactivated. Please contact the administrator for assistance.";

      return res.status(403).json({
        success: false,
        message: message,
        accountStatus: "inactive",
        userRole: user.role,
      });
    }

    // ---- VERIFY PASSWORD ----
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log(`❌ Login failed: Invalid password for ${email}`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    console.log(`✅ Login successful for ${email} (${user.role})`);

    // ---- GENERATE TOKEN ----
    const token = generateToken(user.id, user.role);

    // ---- REMOVE PASSWORD FROM RESPONSE ----
    const { password: _, ...userWithoutPassword } = user;

    // ---- SEND RESPONSE ----
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: userWithoutPassword,
        token, // Frontend should store this token in localStorage
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getProfile = async (req, res) => {
  try {
    // req.user is set by authentication middleware
    const userId = req.user.userId;

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        isActive: users.isActive,
        isEmailVerified: users.isEmailVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { firstName, lastName, phone } = req.body;

    // ---- BUILD UPDATE OBJECT ----
    // Only include fields that were provided
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    updateData.updatedAt = new Date(); // Update timestamp

    // ---- UPDATE USER IN DATABASE ----
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        isActive: users.isActive,
        isEmailVerified: users.isEmailVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    // ---- INPUT VALIDATION ----
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    // ---- GET USER WITH PASSWORD ----
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ---- VERIFY CURRENT PASSWORD ----
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // ---- HASH NEW PASSWORD ----
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // ---- UPDATE PASSWORD IN DATABASE ----
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ============ EXPORT CONTROLLERS ============
module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
};
