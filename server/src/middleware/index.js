// Export all middleware from a single entry point
const { authenticate, authorize, requireAdmin, requireBuyer, requireCooperative, requireBuyerOrCooperative } = require("./auth.middleware");
const { errorHandler, notFoundHandler } = require("./errorHandler");

module.exports = {
  // Authentication middleware
  authenticate,
  authorize,
  requireAdmin,
  requireBuyer,
  requireCooperative,
  requireBuyerOrCooperative,
  // Error handling middleware
  errorHandler,
  notFoundHandler,
};



