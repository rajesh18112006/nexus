import { createServer } from 'http';
import app from './app';
import { connectDB } from './config/db';
import { connectRedis } from './config/redis';
import { initializeSocket } from './events/socket';
import { env } from './config/env';
import { logger } from './config/logger';

async function bootstrap() {
  // Connect to MongoDB Atlas
  await connectDB();

  // Connect to Redis
  try {
    await connectRedis();
  } catch (err) {
    logger.warn({ err }, 'Redis connection failed — BullMQ jobs and caching disabled');
  }

  // Create HTTP server and attach Socket.IO
  const httpServer = createServer(app);
  initializeSocket(httpServer);

  // Start listening
  httpServer.listen(env.PORT, () => {
    logger.info(`
  ╔══════════════════════════════════════════════╗
  ║  NEXUS API — ${env.NODE_ENV.toUpperCase().padEnd(14)}                 ║
  ║  http://localhost:${env.PORT}                        ║
  ║  Swagger: http://localhost:${env.PORT}/api/docs       ║
  ╚══════════════════════════════════════════════╝
  `);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — graceful shutdown`);
    httpServer.close(async () => {
      const { disconnectDB } = await import('./config/db');
      const { disconnectRedis } = await import('./config/redis');
      await disconnectDB();
      await disconnectRedis();
      logger.info('Shutdown complete');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000); // Force exit after 10s
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled rejection');
  });
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Bootstrap failed');
  process.exit(1);
});
