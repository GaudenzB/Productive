import { Request, Response, NextFunction } from 'express';

// Define custom error classes
export class APIError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends APIError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class BadRequestError extends APIError {
  constructor(message: string = 'Bad request') {
    super(message, 400);
  }
}

export class UnauthorizedError extends APIError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends APIError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

// Global error handling middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(`[Error] ${err.name}: ${err.message}`);
  console.error(err.stack);
  
  // Handle specific known errors
  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.statusCode,
        message: err.message
      }
    });
  }
  
  // Handle unknown errors
  return res.status(500).json({
    error: {
      code: 500,
      message: 'Internal server error'
    }
  });
};