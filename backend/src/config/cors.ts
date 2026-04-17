import { CorsOptions } from 'cors';
import env from './env';

const normalizeOrigin = (origin: string) => origin.trim().replace(/\/$/, '').toLowerCase();
const allowedOrigins = env.CORS_ORIGIN
  .split(',')
  .map((o) => normalizeOrigin(o))
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser/server-to-server requests without an Origin header.
    if (!origin) return callback(null, true);

    const normalized = normalizeOrigin(origin);
    const isAllowed = allowedOrigins.includes(normalized);

    if (isAllowed) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Total-Pages'],
  maxAge: 86400,
};

export default corsOptions;
