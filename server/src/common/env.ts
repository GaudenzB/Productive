import { z } from 'zod';
import * as dotenv from 'dotenv';

// Load environment variables from .env file if present
dotenv.config();

// Define schema for environment variables
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Server configuration
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  
  // Session configuration
  SESSION_SECRET: z.string().min(1).default('development_secret'),
  
  // Database configuration
  DATABASE_URL: z.string().min(1),
  
  // CORS configuration
  CORS_ORIGIN: z.string().default('*'),
  
  // API rate limiting
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60 * 1000), // 1 minute
  
  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

// Extract environment variables and validate against schema
export const env = envSchema.parse(process.env);

// Log startup configuration (but don't show secrets)
console.info('Environment Configuration:', {
  NODE_ENV: env.NODE_ENV,
  PORT: env.PORT,
  DATABASE_URL: env.DATABASE_URL ? '[REDACTED]' : 'Not provided',
});