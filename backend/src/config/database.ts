import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

export const connectDatabase = async (): Promise<typeof mongoose> => {
  mongoose.set('strictQuery', true);
  const isAtlas = env.MONGODB_URI.includes('mongodb+srv://');
  const serverSelectionTimeoutMs = isAtlas ? 20000 : 3000;
  const connectTimeoutMs = isAtlas ? 15000 : 3000;
  const maxAttempts = isAtlas ? 2 : 1;
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const conn = await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: serverSelectionTimeoutMs,
        connectTimeoutMS: connectTimeoutMs,
        maxPoolSize: 10,
        minPoolSize: 0,
        maxIdleTimeMS: 60000,
        dbName: env.MONGODB_DATABASE_NAME
      });
      (conn.connection as any).isInMemory = false;
      (conn.connection as any).actualUri = env.MONGODB_URI;
      logger.info(`==================================================`);
      logger.info(`  MONGODB CONNECTED SUCCESSFULLY`);
      logger.info(`  Database Name: kiyo_topup`);
      logger.info(`  Host: ${conn.connection.host}`);
      logger.info(`==================================================`);
      return conn;
    } catch (error: any) {
      lastError = error;
      const isTransient = /secureConnect|timed out|timeout|ETIMEDOUT|ECONNRESET|ECONNREFUSED|server selection/i.test(
        String(error?.message || error)
      );
      logger.warn(`MongoDB connection attempt ${attempt}/${maxAttempts} failed: ${error.message}`);

      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect().catch(() => undefined);
      }

      if (!isTransient || attempt === maxAttempts) break;
      await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
  }

  logger.error(`MongoDB connection failed: ${lastError?.message || 'Unknown connection error'}`);

  if (!env.ALLOW_IN_MEMORY_DB || env.NODE_ENV === 'production') {
    throw lastError;
  }

  logger.warn('Launching explicitly enabled in-memory database fallback for local development.');
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    const inMemoryUri = mongoServer.getUri();

    const conn = await mongoose.connect(inMemoryUri, {
      dbName: env.MONGODB_DATABASE_NAME
    });
    (conn.connection as any).isInMemory = true;
    (conn.connection as any).actualUri = inMemoryUri;
    logger.info(`==================================================`);
    logger.info(`  IN-MEMORY MONGODB RUNNING`);
    logger.info(`  Database Name: kiyo_topup`);
    logger.info(`  URI: ${inMemoryUri}`);
    logger.info(`==================================================`);
    return conn;
  } catch (inMemoryErr: any) {
    logger.error('Failed to launch in-memory MongoDB:', inMemoryErr.message);
    throw inMemoryErr;
  }
};
