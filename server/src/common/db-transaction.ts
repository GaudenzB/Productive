import { db } from './db';
import { dbLogger } from './db-logger';
import { handleDatabaseError } from './db-errors';

/**
 * Execute a database transaction with proper error handling and logging
 * This ensures that multiple operations are executed atomically - either all succeed or all fail
 * 
 * @param callback Function containing database operations to execute within the transaction
 * @returns Result of the callback function
 */
export async function withTransaction<T>(
  callback: (trx: any) => Promise<T>,
  entityName: string = 'unknown'
): Promise<T> {
  const startTime = Date.now();
  
  try {
    // Execute transaction
    const result = await db.transaction(async (trx) => {
      return await callback(trx);
    });
    
    // Log successful transaction
    const duration = Date.now() - startTime;
    dbLogger.logSuccess('transaction', entityName, undefined, duration);
    
    return result;
  } catch (error) {
    // Log and handle error
    dbLogger.logError('transaction', entityName, error);
    
    // Convert database error to API error
    const apiError = handleDatabaseError(error);
    throw apiError;
  }
}

/**
 * Execute a database query with proper error handling and logging
 * This is a utility function for executing single queries with consistent error handling
 * 
 * @param callback Function containing the database query to execute
 * @param entityName Name of the entity being queried (for logging)
 * @param params Query parameters (for logging)
 * @returns Result of the callback function
 */
export async function executeQuery<T>(
  callback: () => Promise<T>,
  entityName: string,
  params?: any
): Promise<T> {
  const startTime = Date.now();
  
  try {
    // Execute query
    const result = await callback();
    
    // Log successful query
    const duration = Date.now() - startTime;
    dbLogger.logSuccess('query', entityName, params, duration);
    
    return result;
  } catch (error) {
    // Log and handle error
    dbLogger.logError('query', entityName, error, params);
    
    // Convert database error to API error
    const apiError = handleDatabaseError(error);
    throw apiError;
  }
}