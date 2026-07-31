import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

export const redisClient = new Redis(env.REDIS_URI, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
  retryStrategy: (times) => {
    if (times > 3) {
      // Stop retrying to prevent event loop lag if Redis is offline
      return null;
    }
    return 1000;
  }
});

redisClient.on('connect', () => {
  logger.info('Redis client connected successfully.');
});

redisClient.on('error', (err) => {
  if (err.message.includes('ECONNREFUSED')) return; // Silence connection refused spams
  logger.error('Redis client error:', err.message);
});

export const connectRedis = async () => {
  const isLocalRedis = /^redis:\/\/(?:localhost|127\.0\.0\.1)(?::|\/|$)/i.test(env.REDIS_URI);
  if (process.env.VERCEL === '1' && isLocalRedis) {
    logger.info('Skipping unavailable local Redis connection in Vercel runtime.');
    return;
  }

  try {
    if (redisClient.status === 'ready' || redisClient.status === 'connecting') return;
    await redisClient.connect();
  } catch (error) {
    logger.warn('Failed to connect to Redis instance. Redis fallback mode active.');
  }
};
