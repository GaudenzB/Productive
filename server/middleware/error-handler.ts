import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors";
import { ZodError } from "zod";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log the error
  console.error(`Error [${req.method}] ${req.path}:`, err);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const errors: Record<string, string> = {};
    err.errors.forEach((error) => {
      if (error.path) {
        const path = error.path.join('.');
        errors[path] = error.message;
      }
    });
    
    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors
    });
  }

  // Handle our custom AppError instances
  if (err instanceof AppError) {
    return res.status(err.status).json({
      status: "error",
      message: err.message,
      ...(err.name === "ValidationError" && { errors: (err as any).errors })
    });
  }

  // Handle other errors
  const statusCode = 500;
  const message = process.env.NODE_ENV === "production"
    ? "An unexpected error occurred"
    : err.message || "An unexpected error occurred";

  return res.status(statusCode).json({
    status: "error",
    message
  });
}