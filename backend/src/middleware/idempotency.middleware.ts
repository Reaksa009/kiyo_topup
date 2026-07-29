import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis';

export const checkIdempotency = async (req: Request, res: Response, next: NextFunction) => {
  const idempotencyKey = req.headers['x-idempotency-key'] as string || req.body.idempotencyKey;

  if (!idempotencyKey) {
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
    // If Redis is unreachable, continue execution safely
    next();
  }
};
