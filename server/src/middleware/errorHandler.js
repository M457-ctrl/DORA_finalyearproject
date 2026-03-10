const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
};

// Global error handler (must have 4 args)
const errorHandler = (err, req, res, next) => {
  // Log for debugging
  console.error("Error:", err);

  // JWT errors
  if (err && err.name === "JsonWebTokenError") {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
  if (err && err.name === "TokenExpiredError") {
    return res.status(401).json({ success: false, message: "Token expired" });
  }

  // Validation errors
  if (err && err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: err.errors,
    });
  }

  const statusCode = (err && err.status) || 500;
  const message = (err && err.message) || "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === "development" ? err?.stack : undefined,
  });
};

module.exports = { errorHandler, notFoundHandler };


