import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env, shouldAutoSeedDatabase } from './config/env';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { logger } from './utils/logger';
import apiRouter from './routes';
import { errorHandler } from './middleware/error.middleware';
import { apiRateLimiter } from './middleware/rateLimiter.middleware';
import { setSocketInstance, initOrderWorker } from './queues/orderQueue';
import { seedDatabase } from './seed';

const app = express();
const server = http.createServer(app);

const configuredOrigins = [
  env.CLIENT_URL,
  env.ADMIN_URL,
  ...env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
]
  .filter(Boolean)
  .map((origin) => {
    try {
      return new URL(origin).origin;
    } catch {
      return origin.replace(/\/$/, '');
    }
  });
const allowedOrigins = new Set(configuredOrigins);
const corsOrigin = (origin: string | undefined, callback: (error: Error | null, allowed?: boolean) => void) => {
  if (!origin || allowedOrigins.has(origin)) {
    callback(null, true);
    return;
  }
  callback(new Error('Origin is not allowed by CORS'));
};

// Initialize Socket.IO with CORS
const io = process.env.VERCEL
  ? null
  : new SocketServer(server, {
      cors: {
        origin: corsOrigin,
        methods: ['GET', 'POST']
      }
    });

if (io) {
  setSocketInstance(io);

  io.on('connection', (socket) => {
    logger.info(`Socket client connected: ${socket.id}`);
    socket.on('disconnect', () => {
      logger.info(`Socket client disconnected: ${socket.id}`);
    });
  });
}

// Middleware
if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}
app.use(helmet());
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Middleware to ensure DB and Redis connection in serverless environment (Vercel)
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;
// Deliberately minimal probes: no environment, dependency host, version, or secret details.
app.get(['/health', '/health/live'], (_req, res) => res.status(200).json({ status: 'ok' }));
app.get('/health/ready', (_req, res) => {
  const ready = isInitialized && mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not_ready' });
});
export const initApp = async () => {
  if (isInitialized && mongoose.connection.readyState === 1) return;

  if (!initializationPromise) {
    initializationPromise = (async () => {
      const isFirstInitialization = !isInitialized;

      if (mongoose.connection.readyState !== 1) {
        await connectDatabase();
      }

      if (isFirstInitialization) {
        await connectRedis();
        if (shouldAutoSeedDatabase(env.AUTO_SEED_DATABASE)) {
          await seedDatabase();
        } else if (env.AUTO_SEED_DATABASE) {
          logger.warn('AUTO_SEED_DATABASE was ignored in a production/serverless runtime.');
        }
      }

      isInitialized = true;
    })();
  }

  try {
    await initializationPromise;
  } finally {
    initializationPromise = null;
  }
};

app.use(async (req, res, next) => {
  try {
    await initApp();
    next();
  } catch (error: any) {
    logger.error(`Application initialization failed: ${error.message}`);
    res.status(503).json({
      success: false,
      message: 'Service initialization failed. Please try again shortly.'
    });
  }
});

// Rate Limiting
app.use(env.API_PREFIX, apiRateLimiter);

// Mount Versioned API Router (/api/v1)
app.use(env.API_PREFIX, apiRouter);

// Global Error Handler
app.use(errorHandler);

const startServer = async () => {
  const PORT = parseInt(env.PORT, 10) || 5000;

  await initApp();
  initOrderWorker();

  server.listen(PORT, () => {
    logger.info(`==================================================`);
    logger.info(`  KIYO TOPUP Backend Server Running on Port ${PORT}`);
    logger.info(`  Environment: ${env.NODE_ENV}`);
    logger.info(`  API Base URL: http://localhost:${PORT}${env.API_PREFIX}`);
    logger.info(`==================================================`);
  });
};

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  startServer().catch((error: any) => {
    logger.error(`Backend startup failed: ${error.message}`);
    process.exitCode = 1;
  });
}

export { app, server, io };
