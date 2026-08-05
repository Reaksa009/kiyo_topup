import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis';
import crypto from 'crypto';

export const checkIdempotency = async (req: Request, res: Response, next: NextFunction) => {
  const idempotencyKey = req.headers['x-idempotency-key'] as string || req.body.idempotencyKey || crypto.randomUUID();
  req.body.idempotencyKey = idempotencyKey;

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
