import React, { Component, ErrorInfo, ReactNode } from "react";
import { EnhancedError, ErrorSeverity, createError } from "@/lib/error-handling";
import { errorTrackingService } from "@/lib/error-service";
import { ErrorNotification } from "./ErrorNotification";
import { Button } from "@/components/ui/button";
import { RefreshCw, Home } from "lucide-react";

interface EnhancedErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: EnhancedError, resetError: () => void) => ReactNode;
  component?: string;
  showNotification?: boolean;
  onError?: (error: EnhancedError) => void;
}

interface EnhancedErrorBoundaryState {
  hasError: boolean;
  error?: EnhancedError;
  errorInfo?: ErrorInfo;
}

/**
 * Enhanced Error Boundary component that captures React errors,
 * converts them to enhanced errors with context, and provides
 * intelligent recovery options.
 */
export class EnhancedErrorBoundary extends Component<
  EnhancedErrorBoundaryProps,
  EnhancedErrorBoundaryState
> {
  constructor(props: EnhancedErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError(error: Error): EnhancedErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error: error instanceof Error 
        ? createError(
            error.message,
            ErrorSeverity.ERROR,
            { component: "Unknown", additionalData: { jsError: true } },
            error
          )
        : createError(
            "An unexpected error occurred",
            ErrorSeverity.ERROR,
            { component: "Unknown", additionalData: { jsError: true } }
          ),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Create an enhanced error with the React component stack
    const enhancedError = createError(
      error.message || "An unexpected UI error occurred",
      ErrorSeverity.ERROR,
      { 
        component: this.props.component || "Unknown Component", 
        additionalData: { 
          componentStack: errorInfo.componentStack,
          jsError: true
        } 
      },
      error
    );

    // Track the error
    errorTrackingService.trackError(enhancedError);
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(enhancedError);
    }

    // Update state with the error info
    this.setState({
      error: enhancedError,
      errorInfo,
    });
  }

  // Reset the error state to recover
  resetError = (): void => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, showNotification = true } = this.props;

    if (hasError && error) {
      // Custom fallback UI if provided
      if (fallback) {
        return fallback(error, this.resetError);
      }

      // Default fallback UI with error recovery options
      return (
        <div>
          {showNotification && (
            <div className="mb-4">
              <ErrorNotification 
                error={error} 
                showDetailedCard 
              />
            </div>
          )}
          
          <div className="p-6 border rounded-lg bg-card text-card-foreground shadow flex flex-col items-center justify-center space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Something went wrong</h2>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              This section of the application encountered an error. You can try to recover by refreshing or going back to the home page.
            </p>
            <div className="flex gap-2 mt-4">
              <Button 
                variant="default" 
                onClick={this.resetError}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = "/"}
              >
                <Home className="mr-2 h-4 w-4" />
                Home page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // When there's no error, render children normally
    return children;
  }
}