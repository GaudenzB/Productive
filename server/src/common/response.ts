import { Response } from 'express';
import { logger } from './logger';

/**
 * Standard API response format
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: number;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    [key: string]: any;
  };
}

/**
 * Send a successful response with data
 * 
 * @param res Express response object
 * @param data Response data
 * @param statusCode HTTP status code (default: 200)
 * @param meta Optional metadata (pagination, etc.)
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  meta?: ApiResponse<T>['meta']
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(meta && { meta })
  };
  
  res.status(statusCode).json(response);
}

/**
 * Send a successful response for creation operations
 * Sets status code to 201 Created
 * 
 * @param res Express response object
 * @param data Created resource data
 * @param meta Optional metadata
 */
export function sendCreated<T>(
  res: Response,
  data: T,
  meta?: ApiResponse<T>['meta']
): void {
  sendSuccess(res, data, 201, meta);
}

/**
 * Send a successful response for operations with no content
 * Sets status code to 204 No Content
 * 
 * @param res Express response object
 */
export function sendNoContent(res: Response): void {
  res.status(204).end();
}

/**
 * Send an error response
 * 
 * @param res Express response object
 * @param error Error object
 * @param statusCode HTTP status code (default: 500)
 * @param details Additional error details
 */
export function sendError(
  res: Response,
  error: Error | string,
  statusCode: number = 500,
  details?: any
): void {
  // Create error message from error object or string
  const message = typeof error === 'string' ? error : error.message || 'Internal Server Error';
  
  // Log the error with full details
  if (statusCode >= 500) {
    logger.error(`API Error [${statusCode}]: ${message}`, 
      typeof error === 'string' ? new Error(error) : error, 
      { details }
    );
  } else {
    logger.warn(`API Error [${statusCode}]: ${message}`, { 
      ...(typeof error !== 'string' && { error: error.name }),
      details 
    });
  }
  
  // Create error response
  const response: ApiResponse<null> = {
    success: false,
    error: {
      code: statusCode,
      message,
      ...(details && { details })
    }
  };
  
  res.status(statusCode).json(response);
}

/**
 * Send a bad request error response (400)
 * 
 * @param res Express response object
 * @param message Error message
 * @param details Additional error details
 */
export function sendBadRequest(
  res: Response,
  message: string = 'Bad Request',
  details?: any
): void {
  sendError(res, message, 400, details);
}

/**
 * Send an unauthorized error response (401)
 * 
 * @param res Express response object
 * @param message Error message
 */
export function sendUnauthorized(
  res: Response,
  message: string = 'Unauthorized'
): void {
  sendError(res, message, 401);
}

/**
 * Send a forbidden error response (403)
 * 
 * @param res Express response object
 * @param message Error message
 */
export function sendForbidden(
  res: Response,
  message: string = 'Forbidden'
): void {
  sendError(res, message, 403);
}

/**
 * Send a not found error response (404)
 * 
 * @param res Express response object
 * @param message Error message
 */
export function sendNotFound(
  res: Response,
  message: string = 'Resource not found'
): void {
  sendError(res, message, 404);
}

/**
 * Send a conflict error response (409)
 * 
 * @param res Express response object
 * @param message Error message
 * @param details Additional error details
 */
export function sendConflict(
  res: Response,
  message: string = 'Resource already exists',
  details?: any
): void {
  sendError(res, message, 409, details);
}