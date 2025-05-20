import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useErrorHandler } from '@/lib/error-handling';
import { errorTrackingService, ErrorTrackingService } from '@/lib/error-service';

// Define the context interface
interface ErrorContextType {
  handleError: ReturnType<typeof useErrorHandler>['handleError'];
  logInfo: ReturnType<typeof useErrorHandler>['logInfo'];
  logWarning: ReturnType<typeof useErrorHandler>['logWarning'];
  logError: ReturnType<typeof useErrorHandler>['logError'];
  logCritical: ReturnType<typeof useErrorHandler>['logCritical'];
  trackingService: ErrorTrackingService;
}

// Create the context with a default value
const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

// Provider component
export function ErrorProvider({ children }: { children: ReactNode }) {
  // Get error handling utilities
  const errorHandler = useErrorHandler();
  
  // Initialize the error tracking service on mount
  useEffect(() => {
    errorTrackingService.init();
  }, []);
  
  // Provide the error handling functions and tracking service to the application
  return (
    <ErrorContext.Provider
      value={{
        ...errorHandler,
        trackingService: errorTrackingService,
      }}
    >
      {children}
    </ErrorContext.Provider>
  );
}

// Custom hook to access the error context
export function useErrorContext() {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useErrorContext must be used within an ErrorProvider');
  }
  return context;
}