const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth.route");
const productsRoutes = require("./routes/products.route");
const adminRoutes = require("./routes/admin.route");
const subAdminRoutes = require("./routes/subadmin.route");
const orderRoutes = require("./routes/orders.route");
const paymentsRoutes = require("./routes/payments.route");

const app = express();

// Helmet helps secure Express apps by setting HTTP response headers
app.use(helmet());

// CORS (Cross-Origin Resource Sharing) middleware
// Allows frontend to communicate with this backend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*", // Allow frontend URL or all origins in development
    credentials: true, // Allow cookies to be sent with requests
  }),
);

// Parse incoming JSON request bodies
app.use(express.json());
// Parse incoming URL-encoded request bodies (form data)
app.use(express.urlencoded({ extended: true }));

// Root endpoint - shows server is running
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to the NepAgriMarket API",
    version: "1.0.0",
  });
});

// Health check endpoint - used to verify server status
app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/subadmin", subAdminRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentsRoutes);

// 404 handler - catches requests that don't match any route
app.use(notFoundHandler);

// Global error handler - catches all errors thrown in the app
app.use(errorHandler);

module.exports = app;
