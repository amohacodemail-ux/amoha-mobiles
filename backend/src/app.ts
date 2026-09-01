import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import corsOptions from './config/cors';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import logger from './utils/logger.util';
import { getRateLimitKey } from './utils/rate-limit.util';

const app = express();

// Render and similar platforms run behind a reverse proxy.
app.set('trust proxy', 1);

// Global rate limiter - prevent DDoS
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1500, // generous limit for 1000+ concurrent users
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getRateLimitKey,
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// Additional security headers
app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self)');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  next();
});

app.use(cors(corsOptions));

// Gzip compression for all responses
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));

// Body parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// Global rate limiter
app.use('/api', globalLimiter);

// HTTP request logging
app.use(
  morgan('combined', {
    stream: { write: (message: string) => logger.info(message.trim()) },
  }),
);

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'AMOHA Mobiles API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export default app;
