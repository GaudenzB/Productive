import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Define environment schema with Zod for validation
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Server configuration
  PORT: z.string().default('5000'),
  
  // Database configuration - required in production
  DATABASE_URL: z.string().min(1),
  
  // Session secret - generate a strong random value in production
  SESSION_SECRET: z.string().default('development-secret-key'),
  
  // Session configuration
  SESSION_EXPIRY: z.string().default('24h').transform((val) => {
    // Parse duration string to milliseconds
    if (val.endsWith('d')) return parseInt(val) * 24 * 60 * 60 * 1000;
    if (val.endsWith('h')) return parseInt(val) * 60 * 60 * 1000;
    if (val.endsWith('m')) return parseInt(val) * 60 * 1000;
    if (val.endsWith('s')) return parseInt(val) * 1000;
    return parseInt(val);
  }),
  
  // CORS configuration
  CORS_ORIGIN: z.string().default('*'),
});

// Extract and parse environment variables
const _env = envSchema.safeParse(process.env);

// Handle validation errors
if (!_env.success) {
  console.error(
    '❌ Invalid environment variables:',
    JSON.stringify(_env.error.format(), null, 2)
  );
  process.exit(1);
}

// Export validated environment variables
export const env = _env.data;