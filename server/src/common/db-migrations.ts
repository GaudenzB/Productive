import { db } from './db';
import * as schema from '@shared/schema';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { Pool } from '@neondatabase/serverless';
import { env } from './env';

/**
 * Run database migrations
 * This function will execute any pending migrations 
 * to ensure the database schema is up-to-date
 */
export async function runMigrations() {
  console.log('Running database migrations...');
  
  try {
    // Create a separate connection for migrations
    const migrationPool = new Pool({ connectionString: env.DATABASE_URL });
    const migrationDb = drizzle(migrationPool, { schema });
    
    // Execute migrations
    await migrate(migrationDb, { migrationsFolder: './drizzle' });
    
    console.log('Database migrations completed successfully');
    
    // Close the migration connection
    await migrationPool.end();
  } catch (error) {
    console.error('Error running database migrations:', error);
    throw error;
  }
}

/**
 * Initialize the database
 * This function checks the database connection and runs migrations
 */
export async function initializeDatabase() {
  console.log('Initializing database...');
  
  try {
    // Test the database connection
    const result = await db.execute(sql`SELECT NOW()`);
    console.log('Database connection successful:', result.rows[0]);
    
    // Run migrations
    await runMigrations();
    
    console.log('Database initialization completed');
  } catch (error) {
    console.error('Database initialization failed:', error);
    
    // In production, we may want to exit the process if the database fails to initialize
    if (env.NODE_ENV === 'production') {
      console.error('Exiting due to database initialization failure in production mode');
      process.exit(1);
    }
  }
}