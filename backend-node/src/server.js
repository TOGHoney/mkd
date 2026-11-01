const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), override: true });
const express = require('express');
const cors = require('cors');
const { connectDB, getDbStatus } = require('./config/db');
const { startIngestionWorker } = require('./queues/ingestionWorker');
const authRoutes = require('./routes/authRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');

const app = express();
// Default to 5000; never collide with port 8000 (FastAPI AI engine)
const PORT = (process.env.PORT && process.env.PORT !== '8000') ? parseInt(process.env.PORT, 10) : 5000;

// Core Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-widget-key', 'x-workspace-id']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve compiled widget bundle for embed script testing
app.use('/dist', express.static(path.join(__dirname, '../public/dist')));
app.use('/dist', express.static(path.join(__dirname, '../../widget/dist')));

const sourceRoutes = require('./routes/sourceRoutes');
const jobRoutes = require('./routes/jobRoutes');
const widgetRoutes = require('./routes/widgetRoutes');
const conversationRoutes = require('./routes/conversationRoutes');

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
app.use('/api/v1/sources', sourceRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/widget', widgetRoutes);
app.use('/api/v1/conversations', conversationRoutes);

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
    startIngestionWorker();
    app.listen(PORT, () => {
      console.log(`[Server] SuperMemory control backend running on port ${PORT}`);
    });
  });
}

module.exports = app;
