import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';

// Type augmentation for the Express Request
declare global {
  namespace Express {
    interface Request {
      id?: string;
      startTime?: number;
    }
  }
}

// Request ID is now added to Express.Request via the global declaration above

/**
 * Request logger middleware
 * Logs incoming requests and outgoing responses with timing information
 */
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  // Generate unique request ID
  const requestId = uuidv4();
  req.id = requestId;
  
  // Record request start time
  req.startTime = Date.now();
  
  // Extract useful information from request
  const { method, originalUrl, ip } = req;
  const userAgent = req.get('user-agent') || 'unknown';
  
  // Log incoming request
  logger.info(`${method} ${originalUrl}`, {
    requestId,
    ip,
    userAgent,
    query: req.query,
    // Only log body for non-GET requests and if not containing sensitive info
    ...(method !== 'GET' && safeToLogBody(originalUrl) ? { body: req.body } : {})
  });
  
  // Capture original response methods
  const originalSend = res.send;
  const originalJson = res.json;
  const originalEnd = res.end;
  
  // Track response body
  let responseBody: any;
  
  // Override response methods to capture and log response
  res.send = function (body: any): Response {
    responseBody = body;
    return originalSend.apply(res, [body]);
  };
  
  res.json = function (body: any): Response {
    responseBody = body;
    return originalJson.apply(res, [body]);
  };
  
  res.end = function (chunk?: any, encoding?: any): Response {
    // Calculate response time
    const responseTime = Date.now() - (req.startTime || Date.now());
    
    // Determine log level based on status code
    const statusCode = res.statusCode;
    let logLevel: 'info' | 'warn' | 'error' = 'info';
    
    if (statusCode >= 500) {
      logLevel = 'error';
    } else if (statusCode >= 400) {
      logLevel = 'warn';
    }
    
    // Prepare log context
    const logContext: Record<string, any> = {
      requestId,
      statusCode,
      responseTime: `${responseTime}ms`,
    };
    
    // Only include response body for errors or if safe to log
    if (statusCode >= 400 || safeToLogBody(originalUrl)) {
      // For JSON responses
      if (responseBody && typeof responseBody === 'string' && responseBody.startsWith('{')) {
        try {
          const parsedBody = JSON.parse(responseBody);
          logContext.response = parsedBody;
        } catch {
          // If can't parse as JSON, include as is
          logContext.response = responseBody;
        }
      } 
      // For non-JSON responses or already parsed JSON
      else if (responseBody) {
        logContext.response = responseBody;
      }
    }
    
    // Log the response
    const logMessage = `${method} ${originalUrl} ${statusCode} ${responseTime}ms`;
    
    if (logLevel === 'error') {
      logger.error(logMessage, new Error(`HTTP ${statusCode}`), logContext);
    } else if (logLevel === 'warn') {
      logger.warn(logMessage, logContext);
    } else {
      logger.info(logMessage, logContext);
    }
    
    // Call original end method with the correct arguments
    if (typeof chunk !== 'undefined') {
      if (typeof encoding !== 'undefined') {
        return originalEnd.apply(res, [chunk, encoding, cb]);
      }
      return originalEnd.apply(res, [chunk, 'utf-8', cb]);
    }
    return originalEnd.apply(res, [null, 'utf-8', cb]);
  };
  
  next();
}

/**
 * Check if it's safe to log the request/response body for a given URL
 * Some endpoints may contain sensitive information that shouldn't be logged
 */
function safeToLogBody(url: string): boolean {
  // Don't log bodies for auth-related endpoints
  const sensitiveEndpoints = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/users',
    '/api/user',
  ];
  
  return !sensitiveEndpoints.some(endpoint => url.includes(endpoint));
}