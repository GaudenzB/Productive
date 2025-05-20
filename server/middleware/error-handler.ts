import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors";
import { ZodError } from "zod";
import { fromZodError } from 'zod-validation-error';

// Interface for error details with context
interface ErrorDetails {
  status: "error";
  message: string;
  code?: string;
  path?: string;
  method?: string;
  timestamp: string;
  requestId?: string;
  errors?: Record<string, string>;
  stack?: string;
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Generate a unique request ID if not already set
  const requestId = req.headers['x-request-id'] 
    ? String(req.headers['x-request-id']) 
    : `req-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

  // Start building error details with context
  const errorDetails: ErrorDetails = {
    status: "error",
    message: err.message || "An unexpected error occurred",
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    requestId
  };

  // Format detailed logs with context
  const logContext = {
    requestId,
    path: req.path,
    method: req.method,
    query: req.query,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString(),
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack
    }
  };

  // Handle Zod validation errors with improved formatting
  if (err instanceof ZodError) {
    // Use zod-validation-error to get more readable error messages
    const validationError = fromZodError(err);
    const errors: Record<string, string> = {};
    
    err.errors.forEach((error) => {
      if (error.path) {
        const path = error.path.join('.');
        errors[path] = error.message;
      }
    });
    
    console.error(`Validation Error [${requestId}]:`, logContext);
    
    return res.status(400).json({
      ...errorDetails,
      message: validationError.message,
      code: "VALIDATION_ERROR",
      errors
    });
  }

  // Handle our custom AppError instances with additional context
  if (err instanceof AppError) {
    console.error(`App Error [${requestId}] [${err.name}]:`, logContext);
    
    return res.status(err.status).json({
      ...errorDetails,
      code: err.name.replace('Error', '').toUpperCase(),
      ...(err.name === "ValidationError" && { errors: (err as any).errors })
    });
  }

  // Handle other errors with appropriate level of detail based on environment
  const statusCode = 500;
  const isProd = process.env.NODE_ENV === "production";
  
  // Log the full error details for debugging
  console.error(`Unhandled Error [${requestId}]:`, logContext);
  
  return res.status(statusCode).json({
    ...errorDetails,
    message: isProd ? "An unexpected error occurred" : errorDetails.message,
    code: "INTERNAL_SERVER_ERROR",
    // Only include stack trace in non-production environments
    ...(isProd ? {} : { stack: err.stack })
  });
}