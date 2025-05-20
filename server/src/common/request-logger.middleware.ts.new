import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Type augmentation for the Express Request
declare global {
  namespace Express {
    interface Request {
      id?: string;
      startTime?: number;
    }
  }
}

/**
 * Request logger middleware
 * Logs incoming requests and outgoing responses with timing information
 */
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  // Generate a unique ID for this request and add it to the request object
  req.id = uuidv4();
  req.startTime = Date.now();
  
  // Log the incoming request
  console.log(`[${req.id}] ${req.method} ${req.originalUrl}`);
  
  // Track the original response methods
  const originalEnd = res.end;
  
  // Override the end method to log response information before the response completes
  res.end = function(this: Response, ...args: any[]) {
    const duration = Date.now() - (req.startTime || 0);
    
    // Log the response information
    console.log(`[${req.id}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    
    // Call the original end method
    return originalEnd.apply(this, args);
  };
  
  next();
}