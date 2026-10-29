const Redis = require('ioredis');

let redisClient = null;
let isConnected = false;

// In-memory fallback map for environments without live Redis
const memoryStore = new Map();
const memoryExpiry = new Map();

const memoryFallback = {
  isFallback: true,
  async get(key) {
    const exp = memoryExpiry.get(key);
    if (exp && Date.now() > exp) {
      memoryStore.delete(key);
      memoryExpiry.delete(key);
      return null;
    }
    return memoryStore.get(key) || null;
  },
  async set(key, value, mode, duration) {
    memoryStore.set(key, String(value));
    if (mode === 'EX' && duration) {
      memoryExpiry.set(key, Date.now() + duration * 1000);
    }
    return 'OK';
  },
  async incr(key) {
    const cur = parseInt(memoryStore.get(key) || '0', 10);
    const next = cur + 1;
    memoryStore.set(key, String(next));
    return next;
  },
  async expire(key, seconds) {
    memoryExpiry.set(key, Date.now() + seconds * 1000);
    return 1;
  },
  async del(key) {
    memoryStore.delete(key);
    memoryExpiry.delete(key);
    return 1;
  },
  on() { return this; },
  status: 'memory-fallback'
};

function getRedisClient() {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // Don't block process if Redis is unavailable
      lazyConnect: true,
      enableOfflineQueue: false
    });

    redisClient.on('connect', () => {
      isConnected = true;
      console.log('[Redis] Connected to Redis server');
    });

    redisClient.on('error', (err) => {
      // Quiet warning for local dev/testing
      isConnected = false;
    });

    // Attempt initial connect asynchronously
    redisClient.connect().catch(() => {
      // Silently swallow initial connect error to allow fallback
    });

    return redisClient;
  } catch (err) {
    console.warn(`[Redis] Using in-memory fallback adapter: ${err.message}`);
    return memoryFallback;
  }
}

function getSafeRedis() {
  const client = getRedisClient();
  if (client && client.status === 'ready') {
    return client;
  }
  return memoryFallback;
}

module.exports = {
  getRedisClient,
  getSafeRedis,
  memoryFallback
};
