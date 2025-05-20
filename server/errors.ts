export class AppError extends Error {
  status: number;
  code: string;
  errors?: Record<string, string>;

  constructor(message: string, status: number = 500, code?: string) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code || this.name.toUpperCase().replace('ERROR', '_ERROR');
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request') {
    super(message, 400, 'BAD_REQUEST');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

export class ValidationError extends AppError {
  errors: Record<string, string>;

  constructor(errors: Record<string, string>, message: string = 'Validation error') {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}