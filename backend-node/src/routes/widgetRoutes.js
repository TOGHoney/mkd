const express = require('express');
const router = express.Router();
const widgetController = require('../controllers/widgetController');
const { requireWidgetAuth } = require('../middlewares/widgetAuth');
const { widgetRateLimiter } = require('../middlewares/rateLimiter');

// Public widget configuration
router.get('/config', requireWidgetAuth, widgetController.getWidgetConfig);

// Public widget streaming chat endpoint protected with origin whitelist and sliding-window rate limit
router.post(
  '/chat',
  requireWidgetAuth,
  widgetRateLimiter({ limit: 30, windowSeconds: 60 }),
  widgetController.handleWidgetChat
);

module.exports = router;
