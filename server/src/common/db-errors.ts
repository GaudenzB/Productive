import { APIError, BadRequestError, NotFoundError } from './error.middleware';

/**
 * Database Error class for handling database-specific errors
 * Extends the base APIError class with database-specific error codes and messages
 */
export class DatabaseError extends APIError {
  constructor(message: string = 'Database error', statusCode: number = 500) {
    super(message, statusCode);
  }
}

/**
 * Connection Error for database connection issues
 */
export class DatabaseConnectionError extends DatabaseError {
  constructor(message: string = 'Database connection error') {
    super(message, 503); // Service Unavailable
  }
}

/**
 * Query Error for issues with database queries
 */
export class DatabaseQueryError extends DatabaseError {
  constructor(message: string = 'Database query error') {
    super(message, 500);
  }
}

/**
 * Record Not Found Error for when a database record is not found
 */
export class RecordNotFoundError extends NotFoundError {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`);
  }
}

/**
 * Unique Constraint Error for when a unique constraint is violated
 */
export class UniqueConstraintError extends BadRequestError {
  constructor(field: string) {
    super(`${field} already exists`);
  }
}

/**
 * Foreign Key Error for when a foreign key constraint is violated
 */
export class ForeignKeyError extends BadRequestError {
  constructor(relation: string) {
    super(`Referenced ${relation} does not exist`);
  }
}

/**
 * Handle database errors and convert them to appropriate API errors
 * This function takes a generic database error and converts it to a specific API error
 * based on the error code or message
 * 
 * @param error The database error to handle
 * @returns An appropriate APIError instance
 */
export function handleDatabaseError(error: any): APIError {
  // Check if it's already an APIError
  if (error instanceof APIError) {
    return error;
  }

  // Check for specific PostgreSQL error codes
  // https://www.postgresql.org/docs/current/errcodes-appendix.html
  if (error.code) {
    switch (error.code) {
      // Connection errors
      case '08000': // connection_exception
      case '08003': // connection_does_not_exist
      case '08006': // connection_failure
        return new DatabaseConnectionError(error.message || 'Failed to connect to database');
      
      // Integrity constraint violations
      case '23505': // unique_violation
        const field = extractFieldFromUniqueViolation(error.message);
        return new UniqueConstraintError(field || 'Record');
      
      case '23503': // foreign_key_violation
        const relation = extractRelationFromForeignKeyViolation(error.message);
        return new ForeignKeyError(relation || 'related record');
      
      case '23502': // not_null_violation
        const column = error.column || 'Required field';
        return new BadRequestError(`${column} cannot be null`);
      
      // Query errors
      case '42P01': // undefined_table
        return new DatabaseQueryError('Table does not exist');
      
      case '42703': // undefined_column
        return new DatabaseQueryError('Column does not exist');
      
      default:
        return new DatabaseError(error.message);
    }
  }

  // Handle other types of errors
  if (error.message?.includes('no rows found')) {
    return new NotFoundError('Record not found');
  }

  return new DatabaseError(error.message || 'Database operation failed');
}

/**
 * Extract the field name from a unique constraint violation error
 * 
 * @param message PostgreSQL error message
 * @returns The field name or null if not found
 */
function extractFieldFromUniqueViolation(message: string): string | null {
  // Example message: 'duplicate key value violates unique constraint "users_email_key"'
  const match = /unique constraint ".*?_(\w+)_key"/.exec(message);
  return match ? match[1] : null;
}

/**
 * Extract the relation name from a foreign key constraint violation error
 * 
 * @param message PostgreSQL error message
 * @returns The relation name or null if not found
 */
function extractRelationFromForeignKeyViolation(message: string): string | null {
  // Example message: 'foreign key constraint "tasks_project_id_fkey" references "projects"'
  const match = /references "(\w+)"/.exec(message);
  return match ? match[1] : null;
}