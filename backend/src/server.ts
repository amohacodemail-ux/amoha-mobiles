import app from './app';
import connectDB from './config/db';
import env from './config/env';
import logger from './utils/logger.util';
import { runV4Migration } from './migrations/v4-order-items-nullable-product';
import { runV7Migration } from './migrations/v7-purchase-price';
import { runV8Migration } from './migrations/v8-ensure-is-active';

// Keep-alive cron for Render free tier (pings health endpoint every 14 minutes)
const startKeepAlive = (port: number | string): void => {
  const INTERVAL_MS = 14 * 60 * 1000; // 14 minutes
  const url = process.env.RENDER_EXTERNAL_URL
    ? `${process.env.RENDER_EXTERNAL_URL}/health`
    : `http://localhost:${port}/health`;

  setInterval(async () => {
    try {
      const res = await fetch(url);
      if (res.ok) {
        logger.info(`[keep-alive] Pinged ${url} — OK`);
      } else {
        logger.warn(`[keep-alive] Pinged ${url} — Status ${res.status}`);
      }
    } catch (err) {
      logger.warn(`[keep-alive] Failed to ping ${url}`, err);
    }
  }, INTERVAL_MS);

  logger.info(`[keep-alive] Cron started — pinging every 14 minutes`);
};

const startServer = async (): Promise<void> => {
  try {
    // Connect to Supabase PostgreSQL
    await connectDB();

    // Run pending schema migrations (non-blocking — server starts regardless)
    runV4Migration().catch((err) =>
      logger.warn('[migration-v4] unexpected error:', err),
    );
    runV7Migration().catch((err) =>
      logger.warn('[migration-v7] unexpected error:', err),
    );
    runV8Migration().catch((err) =>
      logger.warn('[migration-v8] unexpected error:', err),
    );

    // Render provides PORT dynamically
    const PORT = process.env.PORT || env.PORT || 5001;

    // Start Express server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 AMOHA Mobiles API running on port ${PORT}`);
      logger.info(`📦 Environment: ${env.NODE_ENV}`);
      logger.info(`🔗 Health check: /health`);
      logger.info(`📡 API Base: /api`);

      // Start keep-alive cron in production
      if (env.NODE_ENV === 'production') {
        startKeepAlive(PORT);
      }
    });

    // Graceful shutdown
    const shutdown = (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);

      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force shutdown after 10s
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled Rejection:', reason);
      // Don't shutdown in production - let the process stay alive for debugging
      if (env.NODE_ENV !== 'production') {
        shutdown('UNHANDLED_REJECTION');
      }
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      shutdown('UNCAUGHT_EXCEPTION');
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    // Use setTimeout to allow libuv handles to close (Node v24 Windows UV_HANDLE fix)
    setTimeout(() => process.exit(1), 100);
  }
};

startServer();