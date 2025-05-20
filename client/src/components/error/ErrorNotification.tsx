import React, { useState, useEffect } from "react";
import { AlertTriangle, X, LucideIcon } from "lucide-react";
import { EnhancedError, ErrorSeverity } from "@/lib/error-handling";
import { analyzeError, getImmediateFixSuggestion } from "@/lib/error-pattern-analyzer";
import { 
  Alert,
  AlertDescription,
  AlertTitle 
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ErrorSuggestionCard } from "./ErrorSuggestionCard";

interface ErrorNotificationProps {
  error: EnhancedError;
  onDismiss?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  showDetailedCard?: boolean;
}

export function ErrorNotification({
  error,
  onDismiss,
  autoClose = false,
  autoCloseDelay = 8000,
  showDetailedCard = false,
}: ErrorNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showDetails, setShowDetails] = useState(showDetailedCard);
  const [analysis] = useState(() => analyzeError(error));
  const [fixSuggestion] = useState(() => getImmediateFixSuggestion(error));
  
  useEffect(() => {
    let timeoutId: number;
    
    if (autoClose && isVisible && !showDetails) {
      timeoutId = window.setTimeout(() => {
        handleClose();
      }, autoCloseDelay);
    }
    
    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [autoClose, autoCloseDelay, isVisible, showDetails]);
  
  // Handle notification dismissal
  const handleClose = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };
  
  // Handle applying the suggested fix
  const handleApplyFix = () => {
    if (fixSuggestion.actionable && fixSuggestion.action) {
      fixSuggestion.action();
    }
  };
  
  if (!isVisible) {
    return null;
  }
  
  // Get appropriate variant based on error severity
  const getAlertVariant = (): "default" | "destructive" => {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.ERROR:
        return "destructive";
      default:
        return "default";
    }
  };
  
  // Show the detailed error card if requested
  if (showDetails) {
    return (
      <ErrorSuggestionCard 
        error={error} 
        onClose={() => setShowDetails(false)} 
        className="w-full max-w-md mx-auto shadow-lg animate-in fade-in-50 slide-in-from-top-5" 
      />
    );
  }
  
  // Otherwise show the simple alert notification
  return (
    <Alert 
      variant={getAlertVariant()} 
      className="w-full animate-in fade-in-50 slide-in-from-top-5"
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex justify-between">
        <span>{analysis.patternFound && analysis.pattern 
          ? analysis.pattern.name 
          : "Error"}</span>
        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleClose}>
          <X className="h-3 w-3" />
          <span className="sr-only">Close</span>
        </Button>
      </AlertTitle>
      <AlertDescription className="mt-1">
        <p className="text-sm">{error.message}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {fixSuggestion.actionable && (
            <Button size="sm" variant="secondary" onClick={handleApplyFix}>
              {fixSuggestion.suggestion}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setShowDetails(true)}>
            View Details
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}