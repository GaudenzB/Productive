import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { sendBadRequest } from './response';

/**
 * Middleware for validating request data using Zod schemas
 * 
 * @param schema The Zod schema to validate against
 * @param source Where to find the data to validate (body, query, params)
 */
export function validate(schema: z.ZodType<any>, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate the request data against the schema
      const result = schema.safeParse(req[source]);
      
      if (!result.success) {
        // Convert Zod errors to user-friendly format
        const validationError = fromZodError(result.error);
        
        // Format error details
        const details = result.error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        
        // Send formatted error response
        return sendBadRequest(res, validationError.message, { errors: details });
      }
      
      // Replace request data with validated and transformed data
      req[source] = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Specialized middleware for validating request body
 */
export function validateBody(schema: z.ZodType<any>) {
  return validate(schema, 'body');
}

/**
 * Specialized middleware for validating query parameters
 */
export function validateQuery(schema: z.ZodType<any>) {
  return validate(schema, 'query');
}

/**
 * Specialized middleware for validating route parameters
 */
export function validateParams(schema: z.ZodType<any>) {
  return validate(schema, 'params');
}