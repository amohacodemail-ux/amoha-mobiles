import winston from 'winston';
import fs from 'fs';
import env from '../config/env';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Ensure logs directory exists for file transports
try {
  if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs', { recursive: true });
  }
} catch {
  // Ignore if logs dir can't be created (e.g. read-only filesystem)
}

const fileTransports: winston.transport[] = [];
try {
  fileTransports.push(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error', maxsize: 5242880, maxFiles: 5 }),
    new winston.transports.File({ filename: 'logs/combined.log', maxsize: 5242880, maxFiles: 5 }),
  );
} catch {
  // Skip file transports if not writable
}

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: env.IS_PRODUCTION ? combine(logFormat) : combine(colorize(), logFormat),
  }),
  ...fileTransports,
];

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat,
  ),
  defaultMeta: { service: 'amoha-api' },
  transports,
});

export default logger;
