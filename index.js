const express = require("express");
const { defaultLimiter, apiLimiter, strictLimiter } = require("./rate-limiter");

const app = express();
const PORT = process.env.PORT || 7005;

app.set('trust proxy', true);
app.use(express.json());

// Health endpoint (no rate limiting)
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Metrics endpoint (no rate limiting)
app.get("/metrics", (req, res) => {
  res.json({ success: true, data: defaultLimiter.getMetrics() });
});

// Default rate limiting for general endpoints
app.use(defaultLimiter.middleware);

// Basic ping endpoint
app.get("/ping", (req, res) => {
  res.json({ success: true, message: "pong" });
});

// API endpoints with high throughput
app.use("/api", apiLimiter.middleware);
app.get("/api/users", (req, res) => {
  res.json({ users: [{ id: 1, name: "John" }, { id: 2, name: "Jane" }] });
});

// Strict endpoints for auth
app.use("/auth", strictLimiter.middleware);
app.post("/auth/login", (req, res) => {
  res.json({ success: true, token: "mock-token" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
  console.log(`❤️  Health: http://localhost:${PORT}/health`);
});

module.exports = app;
