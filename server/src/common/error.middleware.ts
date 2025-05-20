import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { logger } from './logger';
import { sendError } from './response';
import { 
  DatabaseError, 
  RecordNotFoundError,
  UniqueConstraintError,
  ForeignKeyError,
  ConnectionError
} from './db-errors';

/**
 * Global error handling middleware
 * Catches all uncaught errors and formats them consistently
 */
export function errorHandlerMiddleware(
  error: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  // Get request information for logging
  const { method, originalUrl } = req;
  
  // Log the error with appropriate context
  logger.error(
    `Error in ${method} ${originalUrl}: ${error.message}`,
    error,
    { requestId: req.id }
  );

  // Handle ZodError separately to format validation errors nicely
  if (error instanceof ZodError) {
    const validationError = fromZodError(error);
    
    const details = error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message,
    }));
    
    return sendError(res, validationError.message, 400, { errors: details });
  }
  
  // Handle database errors
  if (error instanceof DatabaseError) {
    // Map different database error types to appropriate HTTP status codes
    if (error instanceof RecordNotFoundError) {
      return sendError(res, error, 404);
    }
    
    if (error instanceof UniqueConstraintError) {
      return sendError(res, error, 409);
    }
    
    if (error instanceof ForeignKeyError) {
      return sendError(res, error, 400);
    }
    
    if (error instanceof ConnectionError) {
      return sendError(res, 'Database connection error. Please try again later.', 503);
    }
    
    // Generic database error
    return sendError(res, 'Database error occurred', 500);
  }
  
  // Handle known error types with specific status codes
  
  // Authentication errors
  if (error.name === 'UnauthorizedError') {
    return sendError(res, 'Authentication required', 401);
  }
  
  if (error.name === 'ForbiddenError') {
    return sendError(res, 'Insufficient permissions', 403);
  }
  
  // Rate limiting
  if (error.name === 'RateLimitError') {
    return sendError(res, 'Too many requests', 429);
  }
  
  // Parse error from request body
  if (error instanceof SyntaxError && 'body' in error) {
    return sendError(res, 'Invalid JSON in request body', 400);
  }
  
  // Default error response
  // In production, don't expose internal error details
  const isDev = process.env.NODE_ENV !== 'production';
  const message = isDev ? error.message : 'Internal server error';
  
  // Include stack trace only in development
  const details = isDev ? { stack: error.stack } : undefined;
  
  return sendError(res, message, 500, details);
}