import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '@shared/schema';
import { env } from './env';
import { logger } from './logger';

// Configure Neon database to use WebSockets
neonConfig.webSocketConstructor = ws;

// Get database URL from environment
const dbUrl = env.DATABASE_URL;

if (!dbUrl) {
  logger.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

// Create connection pool
export const pool = new Pool({ 
  connectionString: dbUrl,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection could not be established
});

// Initialize Drizzle ORM with the connection pool
export const db = drizzle(pool, { schema });

// Handle pool errors
pool.on('error', (err) => {
  logger.error('Unexpected database pool error', err);
});

/**
 * Initialize the database connection
 * This ensures the database is accessible before the server starts
 */
export async function initializeDatabase(): Promise<void> {
  let client;
  
  try {
    logger.info('Testing database connection...');
    
    // Get a client from the pool
    client = await pool.connect();
    
    // Test the connection with a simple query
    const result = await client.query('SELECT NOW() as current_time');
    
    logger.info('Database connection successful', { 
      currentTime: result.rows[0].current_time
    });
    
    return Promise.resolve();
  } catch (error) {
    logger.error('Failed to connect to database', error as Error);
    throw error;
  } finally {
    // Return the client to the pool
    if (client) {
      client.release();
    }
  }
}

/**
 * Clean up database connections
 * Call this when shutting down the server
 */
export async function closeDatabaseConnections(): Promise<void> {
  try {
    logger.info('Closing database connections...');
    await pool.end();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database connections', error as Error);
  }
}