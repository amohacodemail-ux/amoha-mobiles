import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5001'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('30d'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:3001,https://amohamobiles.com,https://www.amohamobiles.com,https://admin.amohamobiles.com'),
  BCRYPT_SALT_ROUNDS: z.string().default('12'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  RAZORPAY_KEY_ID: z.string().min(1, 'RAZORPAY_KEY_ID is required for payment processing'),
  RAZORPAY_KEY_SECRET: z.string().min(1, 'RAZORPAY_KEY_SECRET is required for payment processing'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  setTimeout(() => process.exit(1), 100);
  throw new Error('Invalid environment variables');
}

const env = {
  NODE_ENV: parsed.data.NODE_ENV,
  PORT: parseInt(parsed.data.PORT, 10),
  SUPABASE_URL: parsed.data.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: parsed.data.SUPABASE_SERVICE_ROLE_KEY,
  JWT_ACCESS_SECRET: parsed.data.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: parsed.data.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRY: parsed.data.JWT_ACCESS_EXPIRY,
  JWT_REFRESH_EXPIRY: parsed.data.JWT_REFRESH_EXPIRY,
  CORS_ORIGIN: parsed.data.CORS_ORIGIN,
  BCRYPT_SALT_ROUNDS: parseInt(parsed.data.BCRYPT_SALT_ROUNDS, 10),
  LOG_LEVEL: parsed.data.LOG_LEVEL,
  IS_PRODUCTION: parsed.data.NODE_ENV === 'production',
  RAZORPAY_KEY_ID: parsed.data.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: parsed.data.RAZORPAY_KEY_SECRET,
} as const;

export default env;
