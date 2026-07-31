import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

export const connectDatabase = async (): Promise<typeof mongoose> => {
  mongoose.set('strictQuery', true);
  const isAtlas = env.MONGODB_URI.includes('mongodb+srv://');
  const timeoutMs = isAtlas ? 5000 : 1500;

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: timeoutMs,
      connectTimeoutMS: timeoutMs,
      maxPoolSize: 10,
      minPoolSize: 0,
      maxIdleTimeMS: 60000,
      dbName: 'kiyo_topup'
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
    logger.error(`MongoDB connection failed: ${error.message}`);

    if (!env.ALLOW_IN_MEMORY_DB || env.NODE_ENV === 'production') {
      throw error;
    }

    logger.warn('Launching explicitly enabled in-memory database fallback for local development.');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const inMemoryUri = mongoServer.getUri();
      
      const conn = await mongoose.connect(inMemoryUri, {
        dbName: 'kiyo_topup'
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
  }
};
