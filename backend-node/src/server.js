require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB, getDbStatus } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Core Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-widget-key', 'x-workspace-id']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Probe
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'supermemory-control-backend',
    database: getDbStatus(),
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workspaces', workspaceRoutes);

// Optional route mounting placeholder for source/job/widget routes in subsequent plans
app.use((req, res, next) => {
  // Pass to router if mounted dynamically or return 404
  if (app._customRoutesMounted) return next();
  next();
});

// 404 Fallback
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[ServerError]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Auto-start server if executed directly
if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`[Server] SuperMemory control backend running on port ${PORT}`);
    });
  });
}

module.exports = app;
