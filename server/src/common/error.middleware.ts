import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

/**
 * Global error handling middleware
 */
export function errorHandler(
  err: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  // Get request information for logging
  const { method, originalUrl } = req;
  
  // Log the error
  console.error(`Error in ${method} ${originalUrl}: ${err.message}`, err);

  // Handle ZodError separately to format validation errors
  if (err instanceof ZodError) {
    const validationError = fromZodError(err);
    
    const details = err.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message,
    }));
    
    return res.status(400).json({ 
      error: {
        message: validationError.message,
        details
      }
    });
  }
  
  // Handle known error types with specific status codes
  const status = 'statusCode' in err ? (err as any).statusCode : 500;
  const message = err.message || "Internal Server Error";
  
  // Include stack trace only in development
  const isDev = process.env.NODE_ENV !== 'production';
  const details = isDev ? { stack: err.stack } : undefined;
  
  return res.status(status).json({
    error: {
      message,
      ...(details ? { details } : {})
    }
  });
}