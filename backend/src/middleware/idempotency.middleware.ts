import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis';
import { env } from '../config/env';
import crypto from 'crypto';

const memoryCache = new Map<string, number>();

// Clean up expired keys periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, expiry] of memoryCache.entries()) {
    if (now > expiry) memoryCache.delete(key);
  }
}, 60000).unref?.();

export const checkIdempotency = async (req: Request, res: Response, next: NextFunction) => {
  const idempotencyKey = req.headers['x-idempotency-key'] as string || req.body.idempotencyKey || crypto.randomUUID();
  req.body.idempotencyKey = idempotencyKey;

  const isLocalRedis = /^redis:\/\/(?:localhost|127\.0\.0\.1)(?::|\/|$)/i.test(env.REDIS_URI || '');
  const useMemoryCache = process.env.VERCEL === '1' && isLocalRedis;

  if (useMemoryCache) {
    const exists = memoryCache.has(idempotencyKey);
    if (exists) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate transaction detected. Request with this idempotency key is already being processed.',
        idempotencyKey
      });
    }
    // Lock for 60 seconds
    memoryCache.set(idempotencyKey, Date.now() + 60000);
    return next();
  }

  try {
    const redisKey = `idempotency:${idempotencyKey}`;
    const exists = await redisClient.get(redisKey);

    if (exists) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate transaction detected. Request with this idempotency key is already being processed.',
        idempotencyKey
      });
    }

    // Set lock for 60 seconds
    await redisClient.set(redisKey, 'LOCKED', 'EX', 60);
    next();
  } catch (error) {
    return res.status(503).json({
      success: false,
      message: 'Order processing is temporarily unavailable. Please retry shortly.',
      code: 'IDEMPOTENCY_UNAVAILABLE'
    });
  }
};
