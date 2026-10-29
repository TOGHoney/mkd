const { getSafeRedis } = require('../config/redis');

// In-memory sliding window timestamps for fallback
const windowHistory = new Map();

/**
 * Sliding-window rate limiter middleware for public widget endpoints (QUEUE-04).
 * Default: 30 requests per 60 seconds per IP per workspace.
 */
function widgetRateLimiter({ limit = 30, windowSeconds = 60 } = {}) {
  return async function (req, res, next) {
    const clientIp =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    const workspaceId = req.workspace?._id?.toString() || 'global';
    const key = `ratelimit:${workspaceId}:${clientIp}`;

    const redis = getSafeRedis();

    if (!redis.isFallback) {
      try {
        const current = await redis.incr(key);
        if (current === 1) {
          await redis.expire(key, windowSeconds);
        }

        if (current > limit) {
          res.setHeader('Retry-After', String(windowSeconds));
          return res.status(429).json({
            error: 'Rate limit exceeded. Please wait a moment before sending more messages.',
            retry_after_seconds: windowSeconds
          });
        }

        return next();
      } catch (err) {
        console.warn(`[RateLimiter] Redis error: ${err.message}. Using memory fallback.`);
      }
    }

    // In-memory sliding window fallback
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    let timestamps = windowHistory.get(key) || [];
    // Prune stale timestamps
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= limit) {
      res.setHeader('Retry-After', String(windowSeconds));
      return res.status(429).json({
        error: 'Rate limit exceeded. Please wait a moment before sending more messages.',
        retry_after_seconds: windowSeconds
      });
    }

    timestamps.push(now);
    windowHistory.set(key, timestamps);
    return next();
  };
}

module.exports = {
  widgetRateLimiter,
  windowHistory
};
