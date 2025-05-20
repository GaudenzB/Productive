import { useState, useEffect, useCallback } from 'react';
import { EnhancedError } from '@/lib/error-handling';
import { errorTrackingService } from '@/lib/error-service';
import { 
  analyzeError, 
  getImmediateFixSuggestion, 
  getSelfHelpRecommendations,
  identifyRecurringPatterns
} from '@/lib/error-pattern-analyzer';
import { useToast } from '@/hooks/use-toast';

interface UseErrorRecognitionProps {
  monitorRecurringPatterns?: boolean;
  notifyOnHighPriorityPatterns?: boolean;
  autoFixEnabled?: boolean;
}

export function useErrorRecognition({
  monitorRecurringPatterns = true,
  notifyOnHighPriorityPatterns = true,
  autoFixEnabled = false
}: UseErrorRecognitionProps = {}) {
  const { toast } = useToast();
  const [patternSuggestions, setPatternSuggestions] = useState<ReturnType<typeof getSelfHelpRecommendations>>([]);
  const [recurringPatterns, setRecurringPatterns] = useState<ReturnType<typeof identifyRecurringPatterns>>([]);
  
  // Function to analyze an error and get detailed insights
  const analyzeErrorDetails = useCallback((error: EnhancedError) => {
    return analyzeError(error);
  }, []);
  
  // Function to get an immediate fix suggestion for an error
  const getFixSuggestion = useCallback((error: EnhancedError) => {
    return getImmediateFixSuggestion(error);
  }, []);
  
  // Function to apply an automatic fix if available
  const applyAutoFix = useCallback((error: EnhancedError, showToast = true) => {
    const fix = getImmediateFixSuggestion(error);
    
    if (fix.actionable && fix.action) {
      if (showToast) {
        toast({
          title: 'Auto-fix applied',
          description: fix.suggestion,
          duration: 3000,
        });
      }
      
      // Execute the fix action
      fix.action();
      return true;
    }
    
    return false;
  }, [toast]);
  
  // Handle an error with automated pattern recognition and fix suggestions
  const handleError = useCallback((error: EnhancedError, autoFix = autoFixEnabled) => {
    // Track the error in the error service
    errorTrackingService.trackError(error);
    
    // Analyze the error for pattern recognition
    const analysis = analyzeError(error);
    
    // Show error notification with fix suggestion
    toast({
      variant: 'destructive',
      title: analysis.patternFound && analysis.pattern ? analysis.pattern.name : 'Error',
      description: (
        <div className="space-y-2">
          <p>{error.message}</p>
          {analysis.patternFound && (
            <p className="text-xs opacity-80">
              {analysis.fixSuggestions[0]}
            </p>
          )}
        </div>
      ),
      duration: 6000,
    });
    
    // If auto-fix is enabled, try to apply a fix
    if (autoFix) {
      applyAutoFix(error, true);
    }
    
    return analysis;
  }, [toast, applyAutoFix, autoFixEnabled]);
  
  // Monitor for recurring error patterns
  useEffect(() => {
    if (!monitorRecurringPatterns) return;
    
    const checkRecurringPatterns = () => {
      const recentErrors = errorTrackingService.getRecentErrors();
      const patterns = identifyRecurringPatterns(recentErrors);
      setRecurringPatterns(patterns);
      
      // Get recommendations based on these patterns
      const recommendations = getSelfHelpRecommendations(recentErrors);
      setPatternSuggestions(recommendations);
      
      // Notify on high priority issues
      if (notifyOnHighPriorityPatterns) {
        const highPriorityRecommendation = recommendations.find(r => r.priority === 'high');
        
        if (highPriorityRecommendation) {
          toast({
            title: highPriorityRecommendation.title,
            description: (
              <div className="space-y-1">
                <p>{highPriorityRecommendation.description}</p>
                <p className="text-xs opacity-80">{highPriorityRecommendation.steps[0]}</p>
              </div>
            ),
            duration: 8000,
          });
        }
      }
    };
    
    // Check immediately and then periodically
    checkRecurringPatterns();
    
    const intervalId = setInterval(checkRecurringPatterns, 60000); // Check every minute
    
    // Listen for new errors to trigger pattern analysis
    const listener = () => {
      checkRecurringPatterns();
    };
    
    const removeListener = errorTrackingService.addErrorListener(listener);
    
    return () => {
      clearInterval(intervalId);
      removeListener();
    };
  }, [monitorRecurringPatterns, notifyOnHighPriorityPatterns, toast]);
  
  return {
    // Analysis functions
    analyzeError: analyzeErrorDetails,
    getFixSuggestion,
    
    // Action functions
    handleError,
    applyAutoFix,
    
    // Pattern recognition results
    patternSuggestions,
    recurringPatterns,
    
    // Utilities
    clearPatterns: () => {
      setPatternSuggestions([]);
      setRecurringPatterns([]);
    },
  };
}