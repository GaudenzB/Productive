import { useToast } from "@/hooks/use-toast";

// Error severities to categorize different types of errors
export enum ErrorSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

// Error context to provide additional information about where/why the error occurred
export interface ErrorContext {
  component?: string;
  action?: string;
  route?: string;
  userId?: string;
  additionalData?: Record<string, unknown>;
}

// Structure for consistent error handling
export interface EnhancedError {
  message: string;
  code?: string;
  severity: ErrorSeverity;
  context: ErrorContext;
  originalError?: Error;
  timestamp: Date;
}

// Create a standardized error object with context
export function createError(
  message: string,
  severity: ErrorSeverity = ErrorSeverity.ERROR,
  context: ErrorContext = {},
  originalError?: Error,
  code?: string
): EnhancedError {
  return {
    message,
    code,
    severity,
    context,
    originalError,
    timestamp: new Date(),
  };
}

// Log errors to console with formatting and context
export function logError(error: EnhancedError): void {
  const { message, severity, context, originalError, timestamp, code } = error;
  
  // Format the error for console
  const formattedError = {
    timestamp: timestamp.toISOString(),
    message,
    severity,
    code: code || (originalError instanceof Error ? originalError.name : "UNKNOWN"),
    context,
    stack: originalError?.stack,
  };

  // Log with appropriate severity level
  switch (severity) {
    case ErrorSeverity.INFO:
      console.info(`[INFO] ${message}`, formattedError);
      break;
    case ErrorSeverity.WARNING:
      console.warn(`[WARNING] ${message}`, formattedError);
      break;
    case ErrorSeverity.CRITICAL:
      console.error(`[CRITICAL] ${message}`, formattedError);
      break;
    case ErrorSeverity.ERROR:
    default:
      console.error(`[ERROR] ${message}`, formattedError);
  }

  // If enabled, we could send errors to a monitoring service here
  // sendToErrorMonitoring(formattedError);
}

// Report error to a monitoring service (placeholder for future implementation)
function sendToErrorMonitoring(error: any): void {
  // This would connect to a service like Sentry, LogRocket, etc.
  // Example: Sentry.captureException(error);
}

// Hook to handle errors in components
export function useErrorHandler() {
  const { toast } = useToast();

  return {
    handleError: (error: Error | EnhancedError, context?: ErrorContext) => {
      // If it's already an EnhancedError, use it directly
      const enhancedError = 'severity' in error 
        ? error as EnhancedError 
        : createError(
            error.message || "An unexpected error occurred",
            ErrorSeverity.ERROR,
            context || {},
            error instanceof Error ? error : undefined
          );
      
      // Log the error
      logError(enhancedError);
      
      // Show a user-friendly toast
      toast({
        title: enhancedError.code ? `Error: ${enhancedError.code}` : "Error",
        description: enhancedError.message,
        variant: "destructive",
      });
      
      return enhancedError;
    },
    
    // Convenience methods for different error severities
    logInfo: (message: string, context?: ErrorContext) => {
      const error = createError(message, ErrorSeverity.INFO, context);
      logError(error);
      return error;
    },
    
    logWarning: (message: string, context?: ErrorContext) => {
      const error = createError(message, ErrorSeverity.WARNING, context);
      logError(error);
      toast({
        title: "Warning",
        description: message,
        variant: "default",
      });
      return error;
    },
    
    logError: (message: string, error?: Error, context?: ErrorContext) => {
      const enhancedError = createError(
        message,
        ErrorSeverity.ERROR,
        context,
        error
      );
      logError(enhancedError);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return enhancedError;
    },
    
    logCritical: (message: string, error?: Error, context?: ErrorContext) => {
      const enhancedError = createError(
        message,
        ErrorSeverity.CRITICAL,
        context,
        error
      );
      logError(enhancedError);
      toast({
        title: "Critical Error",
        description: message,
        variant: "destructive",
      });
      return enhancedError;
    },
  };
}