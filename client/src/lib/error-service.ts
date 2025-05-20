import { EnhancedError, ErrorSeverity, ErrorContext } from "./error-handling";

// Simplified error tracking service to collect and analyze errors
export class ErrorTrackingService {
  private static instance: ErrorTrackingService;
  private errors: EnhancedError[] = [];
  private errorListeners: Array<(error: EnhancedError) => void> = [];
  private isInitialized = false;
  
  // Maximum number of errors to keep in memory
  private maxErrorCount = 100;
  
  // Singleton pattern
  public static getInstance(): ErrorTrackingService {
    if (!ErrorTrackingService.instance) {
      ErrorTrackingService.instance = new ErrorTrackingService();
    }
    return ErrorTrackingService.instance;
  }
  
  // Initialize the service
  public init(): void {
    if (this.isInitialized) return;
    
    // Set up global error handlers
    this.setupWindowErrorHandler();
    this.setupPromiseRejectionHandler();
    
    this.isInitialized = true;
    console.info("[ErrorTrackingService] Initialized");
  }
  
  // Track a new error
  public trackError(error: EnhancedError): void {
    // Add error to the collection
    this.errors.unshift(error);
    
    // Keep the array at a reasonable size by trimming oldest errors
    if (this.errors.length > this.maxErrorCount) {
      this.errors = this.errors.slice(0, this.maxErrorCount);
    }
    
    // Notify all listeners
    this.notifyListeners(error);
    
    // Additional logic could be added here:
    // - Sending errors to a backend API
    // - Filtering duplicate errors
    // - Rate limiting for similar errors
  }
  
  // Get recent errors
  public getRecentErrors(): EnhancedError[] {
    return [...this.errors];
  }
  
  // Get error statistics
  public getErrorStats(): { total: number; bySeverity: Record<ErrorSeverity, number> } {
    const stats = {
      total: this.errors.length,
      bySeverity: {
        [ErrorSeverity.INFO]: 0,
        [ErrorSeverity.WARNING]: 0,
        [ErrorSeverity.ERROR]: 0,
        [ErrorSeverity.CRITICAL]: 0
      }
    };
    
    this.errors.forEach(error => {
      stats.bySeverity[error.severity]++;
    });
    
    return stats;
  }
  
  // Add error listener
  public addErrorListener(listener: (error: EnhancedError) => void): () => void {
    this.errorListeners.push(listener);
    
    // Return a function to remove the listener
    return () => {
      this.errorListeners = this.errorListeners.filter(l => l !== listener);
    };
  }
  
  // Notify all listeners about a new error
  private notifyListeners(error: EnhancedError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (e) {
        console.error("Error in error listener:", e);
      }
    });
  }
  
  // Set up global window error handler
  private setupWindowErrorHandler(): void {
    window.addEventListener('error', (event) => {
      const context: ErrorContext = {
        component: 'Window',
        additionalData: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      };
      
      const enhancedError: EnhancedError = {
        message: event.message || 'Unknown error',
        severity: ErrorSeverity.ERROR,
        context,
        originalError: event.error,
        timestamp: new Date()
      };
      
      this.trackError(enhancedError);
    });
  }
  
  // Set up unhandled promise rejection handler
  private setupPromiseRejectionHandler(): void {
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      const context: ErrorContext = {
        component: 'Promise',
        action: 'unhandledRejection'
      };
      
      const enhancedError: EnhancedError = {
        message: error?.message || 'Unhandled Promise Rejection',
        severity: ErrorSeverity.ERROR,
        context,
        originalError: error instanceof Error ? error : undefined,
        timestamp: new Date()
      };
      
      this.trackError(enhancedError);
    });
  }
}

// Export singleton instance
export const errorTrackingService = ErrorTrackingService.getInstance();