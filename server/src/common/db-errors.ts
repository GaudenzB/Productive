/**
 * Custom error classes for database operations
 * These provide more context and better error messages
 */

// Base class for all database-related errors
export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Error for when a record is not found
export class RecordNotFoundError extends DatabaseError {
  constructor(entity: string, id: string) {
    super(`${entity} with ID ${id} not found`);
    this.name = 'RecordNotFoundError';
  }
}

// Error for duplicate key violations
export class UniqueConstraintError extends DatabaseError {
  constructor(entity: string, field: string, value: string) {
    super(`${entity} with ${field} "${value}" already exists`);
    this.name = 'UniqueConstraintError';
  }
}

// Error for foreign key violations
export class ForeignKeyError extends DatabaseError {
  constructor(entity: string, field: string, relatedEntity: string) {
    super(`Referenced ${relatedEntity} in ${entity}.${field} does not exist`);
    this.name = 'ForeignKeyError';
  }
}

// Error for check constraint violations
export class CheckConstraintError extends DatabaseError {
  constructor(entity: string, constraint: string) {
    super(`Check constraint "${constraint}" violated for ${entity}`);
    this.name = 'CheckConstraintError';
  }
}

// Error for connection issues
export class ConnectionError extends DatabaseError {
  constructor(detail?: string) {
    super(`Database connection failed${detail ? `: ${detail}` : ''}`);
    this.name = 'ConnectionError';
  }
}

// Error for query timeout
export class QueryTimeoutError extends DatabaseError {
  constructor() {
    super('Database query timed out');
    this.name = 'QueryTimeoutError';
  }
}

/**
 * Map database errors to more user-friendly API errors
 * This function analyzes the database error and converts it to a more specific error type
 * 
 * @param error The original database error
 * @returns A more specific error type
 */
export function handleDatabaseError(error: any): Error {
  // If it's already a custom error, return it
  if (error instanceof DatabaseError) {
    return error;
  }

  // PostgreSQL error codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
  const pgErrorCode = error.code;
  
  if (!pgErrorCode) {
    return new DatabaseError(error.message || 'Unknown database error');
  }

  // Common PostgreSQL error codes
  switch (pgErrorCode) {
    // Connection errors (Class 08)
    case '08000': // connection_exception
    case '08003': // connection_does_not_exist
    case '08006': // connection_failure
    case '08001': // sqlclient_unable_to_establish_sqlconnection
    case '08004': // sqlserver_rejected_establishment_of_sqlconnection
      return new ConnectionError(error.detail);
      
    // Unique violation (23505)
    case '23505':
      const match = error.detail?.match(/Key \((.*?)\)=\((.*?)\) already exists/);
      if (match) {
        return new UniqueConstraintError(error.table || 'record', match[1], match[2]);
      }
      return new UniqueConstraintError('record', 'unknown', 'value');
    
    // Foreign key violation (23503)
    case '23503':
      const fkMatch = error.detail?.match(/Key \((.*?)\)=\((.*?)\) is not present in table "(.*?)"/);
      if (fkMatch) {
        return new ForeignKeyError(error.table || 'record', fkMatch[1], fkMatch[3]);
      }
      return new ForeignKeyError('record', 'unknown', 'referenced table');
    
    // Check constraint violation (23514)
    case '23514':
      return new CheckConstraintError(error.table || 'record', error.constraint || 'unknown');
    
    // Query canceled / timeout (57014)
    case '57014':
      return new QueryTimeoutError();
    
    // No data / not found (P0002)
    case 'P0002':
      const entity = error.table || 'record';
      const idMatch = error.message?.match(/with ID (\w+)/);
      const id = idMatch ? idMatch[1] : 'unknown';
      return new RecordNotFoundError(entity, id);
    
    // Default: return a generic database error
    default:
      return new DatabaseError(
        error.message || `Database error: ${pgErrorCode}${error.detail ? ` - ${error.detail}` : ''}`
      );
  }
}