import { useCallback } from 'react';
import { useErrorContext } from '@/contexts/ErrorContext';
import { ErrorSeverity, ErrorContext } from '@/lib/error-handling';

// Type for standard API error response
interface ApiErrorResponse {
  status: "error";
  message: string;
  code?: string;
  errors?: Record<string, string>;
  path?: string;
  method?: string;
  requestId?: string;
}

/**
 * Custom hook for handling API errors consistently across the application
 * Provides specialized error handling for API responses
 */
export function useApiErrorHandler() {
  const { handleError, trackingService } = useErrorContext();
  
  /**
   * Handle an API error with proper context and formatting
   */
  const handleApiError = useCallback((
    error: Error | Response | unknown,
    resource: string,
    action: string,
    customMessage?: string
  ) => {
    let parsedError: Error;
    let errorContext: ErrorContext = {
      component: resource,
      action,
      additionalData: {}
    };

    // Handle different error types
    if (error instanceof Response) {
      // For Response objects (fetch API)
      parsedError = new Error(customMessage || `Failed to ${action} ${resource}: ${error.statusText}`);
      errorContext.additionalData = {
        status: error.status,
        statusText: error.statusText,
      };
    } else if (error instanceof Error) {
      // For standard JS errors
      parsedError = error;
    } else {
      // For unknown error types
      parsedError = new Error(customMessage || `Unknown error when trying to ${action} ${resource}`);
      errorContext.additionalData = { originalError: error };
    }

    // Try to parse more details from error.message if it's a JSON string
    try {
      if (typeof parsedError.message === 'string' && 
          (parsedError.message.startsWith('{') || parsedError.message.includes('{"status":"error"'))) {
        const errorData = JSON.parse(parsedError.message) as ApiErrorResponse;
        
        // Enhance the error with API response details
        parsedError = new Error(errorData.message || parsedError.message);
        errorContext.additionalData = {
          ...errorContext.additionalData,
          code: errorData.code,
          validationErrors: errorData.errors,
          requestId: errorData.requestId,
          path: errorData.path,
          method: errorData.method
        };
      }
    } catch (e) {
      // If we can't parse as JSON, just use the original error
    }

    // Determine error severity based on the error type
    let severity = ErrorSeverity.ERROR;
    
    // Check for network-related errors
    if (parsedError.message.includes('Network') || 
        parsedError.message.includes('Failed to fetch')) {
      severity = ErrorSeverity.WARNING;
    }
    
    // Check for authentication errors
    else if (parsedError.message.includes('401') || 
             parsedError.message.includes('Unauthorized')) {
      severity = ErrorSeverity.WARNING;
    }
    
    // Check for server errors
    else if (parsedError.message.includes('500') || 
             parsedError.message.includes('Internal Server Error')) {
      severity = ErrorSeverity.CRITICAL;
    }

    // Track the error with our centralized error tracking
    return handleError(parsedError, { ...errorContext, severity });
  }, [handleError, trackingService]);

  return { handleApiError };
}