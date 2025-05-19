import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { BadRequestError } from './error.middleware';
import { fromZodError } from 'zod-validation-error';

/**
 * Middleware factory that validates request data against a Zod schema
 * @param schema The Zod schema to validate against
 * @param source Where to find the data to validate ('body', 'query', 'params')
 */
export const validate = (schema: AnyZodObject, source: 'body' | 'query' | 'params' = 'body') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate the data against the schema
      const data = await schema.parseAsync(req[source]);
      
      // Replace the request data with the validated data
      req[source] = data;
      
      // Continue to the next middleware
      next();
    } catch (error) {
      // Convert Zod validation errors to a more readable format
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return next(new BadRequestError(validationError.message));
      }
      
      // Pass other errors to the error handler
      next(error);
    }
  };
};