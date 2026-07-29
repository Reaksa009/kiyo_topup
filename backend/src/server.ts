import express from 'express';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
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

// Initialize Socket.IO with CORS
const io = new SocketServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

setSocketInstance(io);

io.on('connection', (socket) => {
  logger.info(`Socket client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    logger.info(`Socket client disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Rate Limiting
app.use(env.API_PREFIX, apiRateLimiter);

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'KIYO TOPUP Backend API',
    time: new Date().toISOString()
  });
});

// Mount Versioned API Router (/api/v1)
app.use(env.API_PREFIX, apiRouter);

// Global Error Handler
app.use(errorHandler);

// Middleware to ensure DB and Redis connection in serverless environment (Vercel)
let isInitialized = false;
const initApp = async () => {
  if (isInitialized) return;
  try {
    await connectDatabase();
    await connectRedis();
    if (process.env.VERCEL) {
      await seedDatabase();
    }
    isInitialized = true;
  } catch (error: any) {
    logger.warn('Initialization warning (Server remains active with fallback mock data):', error.message);
  }
};

app.use(async (req, res, next) => {
  await initApp();
  next();
});

const startServer = async () => {
  const PORT = parseInt(env.PORT, 10) || 5000;

  // Always listen on HTTP port first
  server.listen(PORT, () => {
    logger.info(`==================================================`);
    logger.info(`  KIYO TOPUP Backend Server Running on Port ${PORT}`);
    logger.info(`  Environment: ${env.NODE_ENV}`);
    logger.info(`  API Base URL: http://localhost:${PORT}${env.API_PREFIX}`);
    logger.info(`==================================================`);
  });

  await initApp();
  initOrderWorker();
};

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  startServer();
}

export { app, server, io };
