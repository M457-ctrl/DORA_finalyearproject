// Load environment variables from .env file
require("dotenv").config();

// Import the Express app configured in src/index.js
const app = require("./src/index");

// Get the port from environment variables or use default 5000
const PORT = process.env.PORT || 5000;

// ============ START SERVER ============
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `Database: ${process.env.DATABASE_URL ? "Connected" : "Not configured"}`
  );
});

// ============ GRACEFUL SHUTDOWN ============
// Handle SIGTERM signal (used by Docker, process managers)
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});

// Handle SIGINT signal (Ctrl+C in terminal)
process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
