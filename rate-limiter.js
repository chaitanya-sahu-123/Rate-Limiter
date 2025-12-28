const Redis = require("ioredis");

// Redis client with better error handling
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true
});

// Handle Redis connection errors
redis.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

// Rate limiting configurations
const CONFIGS = {
  default: { window: 60, limit: 100, block: 300 },
  api: { window: 60, limit: 500, block: 120 },
  strict: { window: 60, limit: 10, block: 600 }
};

// Metrics
let metrics = {
  totalRequests: 0,
  blockedRequests: 0,
  startTime: Date.now()
};

class RateLimiter {
  constructor(configName = 'default') {
    this.config = CONFIGS[configName];
  }

  async isRateLimited(userId) {
    const now = Math.floor(Date.now() / 1000);
    const window = Math.floor(now / this.config.window) * this.config.window;
    const key = `rate:${userId}:${window}`;
    const blockKey = `block:${userId}`;

    try {
      // Check if blocked
      const blocked = await redis.exists(blockKey);
      if (blocked) return true;

      // Increment counter
      const count = await redis.incr(key);
      await redis.expire(key, this.config.window * 2);

      // Block if limit exceeded
      if (count > this.config.limit) {
        await redis.setex(blockKey, this.config.block, '1');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Redis error:', error.message);
      return false; // Fail open
    }
  }

  middleware = async (req, res, next) => {
    metrics.totalRequests++;
    
    const userId = req.headers['user-id'] || req.connection.remoteAddress || 'anonymous';
    
    const isLimited = await this.isRateLimited(userId);
    
    // Add headers
    res.set({
      'X-RateLimit-Limit': this.config.limit,
      'X-RateLimit-Window': this.config.window
    });

    if (isLimited) {
      metrics.blockedRequests++;
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: this.config.block
      });
    }

    next();
  };

  getMetrics() {
    const uptime = (Date.now() - metrics.startTime) / 1000;
    return {
      totalRequests: metrics.totalRequests,
      blockedRequests: metrics.blockedRequests,
      requestsPerSecond: (metrics.totalRequests / uptime).toFixed(2),
      uptime: `${Math.floor(uptime)}s`
    };
  }
}

// Export instances
module.exports = {
  defaultLimiter: new RateLimiter('default'),
  apiLimiter: new RateLimiter('api'),
  strictLimiter: new RateLimiter('strict'),
  metrics
};
