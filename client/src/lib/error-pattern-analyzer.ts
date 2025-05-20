import { EnhancedError, ErrorSeverity, ErrorContext } from "./error-handling";

interface ErrorPattern {
  id: string;
  name: string;
  description: string;
  severity: ErrorSeverity;
  matcher: (error: EnhancedError) => boolean;
  suggestions: string[];
  documentationUrl?: string;
}

interface ErrorRecognitionResult {
  patternFound: boolean;
  pattern?: ErrorPattern;
  confidence: number; // 0-100
  fixSuggestions: string[];
  contextualHelp?: string;
}

// Common error patterns that can be recognized
const knownErrorPatterns: ErrorPattern[] = [
  {
    id: "network-connectivity",
    name: "Network Connectivity Issue",
    description: "The application is unable to connect to the server or API endpoint",
    severity: ErrorSeverity.ERROR,
    matcher: (error: EnhancedError) => {
      const message = error.message.toLowerCase();
      const originalMessage = error.originalError?.message?.toLowerCase() || '';
      
      return (
        message.includes('network') ||
        message.includes('failed to fetch') ||
        message.includes('network error') ||
        message.includes('cannot connect') ||
        originalMessage.includes('network') ||
        originalMessage.includes('failed to fetch') ||
        originalMessage.includes('network error') ||
        originalMessage.includes('cannot connect')
      );
    },
    suggestions: [
      "Check your internet connection",
      "Verify the API endpoint is accessible",
      "The server might be down or experiencing issues",
      "Check your firewall or network security settings",
      "Try again in a few moments"
    ],
    documentationUrl: "/help/network-connectivity-issues"
  },
  {
    id: "authentication-expired",
    name: "Authentication Expired",
    description: "Your session has expired or authentication token is invalid",
    severity: ErrorSeverity.WARNING,
    matcher: (error: EnhancedError) => {
      const message = error.message.toLowerCase();
      const originalMessage = error.originalError?.message?.toLowerCase() || '';
      const statusCode = error.context?.additionalData?.statusCode;
      
      return (
        message.includes('unauthorized') ||
        message.includes('authentication') ||
        message.includes('unauthenticated') ||
        message.includes('session expired') ||
        message.includes('not logged in') ||
        originalMessage.includes('unauthorized') ||
        statusCode === 401
      );
    },
    suggestions: [
      "Log in again to refresh your session",
      "Your authentication has expired, please log in again",
      "Check if your account has the necessary permissions"
    ],
    documentationUrl: "/help/authentication-issues"
  },
  {
    id: "validation-error",
    name: "Form Validation Error",
    description: "The data you entered doesn't meet the required format or rules",
    severity: ErrorSeverity.WARNING,
    matcher: (error: EnhancedError) => {
      const message = error.message.toLowerCase();
      const originalMessage = error.originalError?.message?.toLowerCase() || '';
      const statusCode = error.context?.additionalData?.statusCode;
      
      return (
        message.includes('validation') ||
        message.includes('invalid input') ||
        message.includes('required field') ||
        originalMessage.includes('validation') ||
        statusCode === 400 ||
        error.code === 'VALIDATION_ERROR'
      );
    },
    suggestions: [
      "Check the form fields for any incorrect or missing values",
      "Make sure all required fields are filled",
      "Verify that dates, emails, and other formats are correct",
      "Some fields might have minimum or maximum length requirements"
    ],
    documentationUrl: "/help/validation-issues"
  },
  {
    id: "permission-denied",
    name: "Permission Denied",
    description: "You don't have sufficient permissions to perform this action",
    severity: ErrorSeverity.ERROR,
    matcher: (error: EnhancedError) => {
      const message = error.message.toLowerCase();
      const originalMessage = error.originalError?.message?.toLowerCase() || '';
      const statusCode = error.context?.additionalData?.statusCode;
      
      return (
        message.includes('permission') ||
        message.includes('forbidden') ||
        message.includes('access denied') ||
        originalMessage.includes('permission') ||
        originalMessage.includes('forbidden') ||
        statusCode === 403
      );
    },
    suggestions: [
      "Contact an administrator to request access",
      "Your account doesn't have permission for this action",
      "You might need to be assigned to a different role or group",
      "Check if the resource has been shared with you"
    ],
    documentationUrl: "/help/permission-issues"
  },
  {
    id: "resource-not-found",
    name: "Resource Not Found",
    description: "The requested item, page, or resource doesn't exist or has been moved",
    severity: ErrorSeverity.ERROR,
    matcher: (error: EnhancedError) => {
      const message = error.message.toLowerCase();
      const originalMessage = error.originalError?.message?.toLowerCase() || '';
      const statusCode = error.context?.additionalData?.statusCode;
      
      return (
        message.includes('not found') ||
        message.includes('404') ||
        message.includes('does not exist') ||
        message.includes('could not find') ||
        originalMessage.includes('not found') ||
        statusCode === 404
      );
    },
    suggestions: [
      "The item you're looking for may have been deleted",
      "Check that the ID or URL is correct",
      "The resource might have been moved or renamed",
      "Return to the previous page and try a different link"
    ],
    documentationUrl: "/help/missing-resources"
  },
  {
    id: "server-error",
    name: "Server Error",
    description: "The server encountered an unexpected condition that prevented it from fulfilling the request",
    severity: ErrorSeverity.CRITICAL,
    matcher: (error: EnhancedError) => {
      const message = error.message.toLowerCase();
      const originalMessage = error.originalError?.message?.toLowerCase() || '';
      const statusCode = error.context?.additionalData?.statusCode;
      
      return (
        message.includes('server error') ||
        message.includes('internal error') ||
        message.includes('500') ||
        originalMessage.includes('server error') ||
        statusCode === 500
      );
    },
    suggestions: [
      "This is a server-side issue that has been logged for investigation",
      "Try again later as the issue might be temporary",
      "If the problem persists, contact support",
      "Check the application status page for any ongoing issues"
    ],
    documentationUrl: "/help/server-errors"
  },
  {
    id: "rate-limit-exceeded",
    name: "Rate Limit Exceeded",
    description: "You've made too many requests in a short period of time",
    severity: ErrorSeverity.WARNING,
    matcher: (error: EnhancedError) => {
      const message = error.message.toLowerCase();
      const originalMessage = error.originalError?.message?.toLowerCase() || '';
      const statusCode = error.context?.additionalData?.statusCode;
      
      return (
        message.includes('rate limit') ||
        message.includes('too many requests') ||
        message.includes('throttled') ||
        originalMessage.includes('rate limit') ||
        statusCode === 429
      );
    },
    suggestions: [
      "Please wait before trying again",
      "You've hit the request limit for this API or feature",
      "Try again in a few minutes when your quota resets",
      "Consider optimizing your code to make fewer API calls"
    ],
    documentationUrl: "/help/rate-limiting"
  },
  {
    id: "data-conflict",
    name: "Data Conflict",
    description: "The action couldn't be completed because it conflicts with the current state of the resource",
    severity: ErrorSeverity.ERROR,
    matcher: (error: EnhancedError) => {
      const message = error.message.toLowerCase();
      const originalMessage = error.originalError?.message?.toLowerCase() || '';
      const statusCode = error.context?.additionalData?.statusCode;
      
      return (
        message.includes('conflict') ||
        message.includes('already exists') ||
        message.includes('duplicate') ||
        originalMessage.includes('conflict') ||
        statusCode === 409
      );
    },
    suggestions: [
      "An item with this name or identifier already exists",
      "Try using a different identifier or name",
      "The resource has been modified by another user; refresh and try again",
      "Check for any unique constraints that might be violated"
    ],
    documentationUrl: "/help/data-conflicts"
  },
  {
    id: "offline-mode",
    name: "Offline Mode",
    description: "The application is currently in offline mode or cannot connect to the internet",
    severity: ErrorSeverity.WARNING,
    matcher: (error: EnhancedError) => {
      const message = error.message.toLowerCase();
      const originalMessage = error.originalError?.message?.toLowerCase() || '';
      
      return (
        message.includes('offline') ||
        message.includes('no internet') ||
        message.includes('disconnected') ||
        originalMessage.includes('offline') ||
        navigator.onLine === false
      );
    },
    suggestions: [
      "Check your internet connection",
      "You appear to be offline; some features may be limited",
      "Your changes will be saved locally and synced when you're back online",
      "Try reconnecting to your network"
    ],
    documentationUrl: "/help/offline-mode"
  },
  {
    id: "browser-storage-full",
    name: "Browser Storage Full",
    description: "The browser's storage quota has been exceeded",
    severity: ErrorSeverity.WARNING,
    matcher: (error: EnhancedError) => {
      const message = error.message.toLowerCase();
      const originalMessage = error.originalError?.message?.toLowerCase() || '';
      
      return (
        message.includes('quota') ||
        message.includes('storage') ||
        message.includes('exceeded') ||
        message.includes('full') ||
        originalMessage.includes('quota exceeded') ||
        originalMessage.includes('storage full')
      );
    },
    suggestions: [
      "Clear your browser cache and storage",
      "Try removing unnecessary data from other applications",
      "You might need to free up space in your browser storage",
      "Consider using private browsing or a different browser"
    ],
    documentationUrl: "/help/storage-issues"
  }
];

// Function to match errors with known patterns and provide helpful suggestions
export function analyzeError(error: EnhancedError): ErrorRecognitionResult {
  // Default result if no pattern is matched
  const defaultResult: ErrorRecognitionResult = {
    patternFound: false,
    confidence: 0,
    fixSuggestions: ["Try refreshing the page", "Check your network connection", "Contact support if the issue persists"]
  };
  
  // Try to match the error against known patterns
  for (const pattern of knownErrorPatterns) {
    if (pattern.matcher(error)) {
      return {
        patternFound: true,
        pattern,
        confidence: calculateConfidence(error, pattern),
        fixSuggestions: pattern.suggestions,
        contextualHelp: generateContextualHelp(error, pattern)
      };
    }
  }
  
  // No pattern matched
  return {
    ...defaultResult,
    contextualHelp: generateGenericHelp(error)
  };
}

// Calculate confidence level of the pattern match
function calculateConfidence(error: EnhancedError, pattern: ErrorPattern): number {
  let confidence = 60; // Base confidence
  
  // Exact message match boosts confidence
  if (error.message.toLowerCase().includes(pattern.name.toLowerCase())) {
    confidence += 20;
  }
  
  // Status code match boosts confidence
  const statusCode = error.context?.additionalData?.statusCode;
  if (statusCode) {
    if (
      (pattern.id === "authentication-expired" && statusCode === 401) ||
      (pattern.id === "permission-denied" && statusCode === 403) ||
      (pattern.id === "resource-not-found" && statusCode === 404) ||
      (pattern.id === "server-error" && statusCode === 500) ||
      (pattern.id === "rate-limit-exceeded" && statusCode === 429) ||
      (pattern.id === "data-conflict" && statusCode === 409) ||
      (pattern.id === "validation-error" && statusCode === 400)
    ) {
      confidence += 30;
    }
  }
  
  // Component context match
  if (
    (pattern.id === "validation-error" && error.context?.component?.includes("Form")) ||
    (pattern.id === "network-connectivity" && error.context?.component?.includes("API"))
  ) {
    confidence += 10;
  }
  
  // Cap confidence at 100
  return Math.min(confidence, 100);
}

// Generate contextual help based on the error and matched pattern
function generateContextualHelp(error: EnhancedError, pattern: ErrorPattern): string {
  let help = `We've identified this as a **${pattern.name}**. ${pattern.description}.`;
  
  // Add contextual information based on the specific error
  switch (pattern.id) {
    case "network-connectivity":
      help += " This might be a temporary issue with your connection or our servers.";
      break;
    case "authentication-expired":
      help += " Your session may have timed out for security reasons.";
      break;
    case "validation-error":
      const fieldInfo = error.context?.additionalData?.fields 
        ? ` Check these fields: ${Object.keys(error.context.additionalData.fields).join(", ")}.` 
        : "";
      help += fieldInfo;
      break;
    case "resource-not-found":
      const resourceId = error.context?.additionalData?.resourceId;
      if (resourceId) {
        help += ` The resource with ID '${resourceId}' could not be found.`;
      }
      break;
    case "server-error":
      help += " Our team has been notified of this issue.";
      break;
  }
  
  // Add documentation link if available
  if (pattern.documentationUrl) {
    help += ` [Learn more](${pattern.documentationUrl})`;
  }
  
  return help;
}

// Generate generic help for unrecognized errors
function generateGenericHelp(error: EnhancedError): string {
  const component = error.context?.component 
    ? ` This occurred in the ${error.context.component} component.` 
    : "";
  
  const action = error.context?.action 
    ? ` You were attempting to ${error.context.action}.` 
    : "";
  
  return `We encountered an unexpected error.${component}${action} If this problem persists, please contact support with the following error details: "${error.message}"`;
}

// Function to group similar errors for pattern detection
export function groupSimilarErrors(errors: EnhancedError[]): Record<string, EnhancedError[]> {
  const groups: Record<string, EnhancedError[]> = {};
  
  errors.forEach(error => {
    // Try to find a matching pattern
    for (const pattern of knownErrorPatterns) {
      if (pattern.matcher(error)) {
        if (!groups[pattern.id]) {
          groups[pattern.id] = [];
        }
        groups[pattern.id].push(error);
        return;
      }
    }
    
    // If no pattern matched, try to group by error message similarity
    const messageKey = error.message
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 30);
    
    const groupKey = `unknown-${messageKey}`;
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(error);
  });
  
  return groups;
}

// Identify recurring error patterns for proactive fixing
export function identifyRecurringPatterns(errors: EnhancedError[]): {
  patternId: string;
  patternName: string;
  count: number;
  suggestions: string[];
  severity: ErrorSeverity;
}[] {
  const groups = groupSimilarErrors(errors);
  const patterns: {
    patternId: string;
    patternName: string;
    count: number;
    suggestions: string[];
    severity: ErrorSeverity;
  }[] = [];
  
  for (const [groupKey, groupErrors] of Object.entries(groups)) {
    // Only report patterns that occur multiple times
    if (groupErrors.length > 1) {
      // Try to find a known pattern first
      const knownPattern = knownErrorPatterns.find(p => p.id === groupKey);
      
      if (knownPattern) {
        patterns.push({
          patternId: knownPattern.id,
          patternName: knownPattern.name,
          count: groupErrors.length,
          suggestions: knownPattern.suggestions,
          severity: knownPattern.severity
        });
      } else if (groupKey.startsWith('unknown-') && groupErrors.length >= 3) {
        // For unknown patterns, only report if they occur 3+ times
        patterns.push({
          patternId: groupKey,
          patternName: `Recurring Error: ${groupErrors[0].message.substring(0, 50)}...`,
          count: groupErrors.length,
          suggestions: [
            "This error has occurred multiple times",
            "Try refreshing the application",
            "Check if you're taking the same action repeatedly",
            "Consider reaching out to support"
          ],
          severity: ErrorSeverity.WARNING
        });
      }
    }
  }
  
  // Sort by count (most frequent first)
  return patterns.sort((a, b) => b.count - a.count);
}

// Function to generate a fix recommendation based on error and user behavior
export function generateFixRecommendation(error: EnhancedError, recentErrors: EnhancedError[]): string {
  const analysis = analyzeError(error);
  
  if (analysis.patternFound && analysis.pattern) {
    // Check if this error has happened multiple times recently
    const similarErrors = recentErrors.filter(e => 
      analyzeError(e).pattern?.id === analysis.pattern?.id);
    
    if (similarErrors.length > 2) {
      return `This issue has occurred ${similarErrors.length} times recently. ${analysis.pattern.suggestions[0]} If the problem persists, consider these additional steps: ${analysis.pattern.suggestions.slice(1, 3).join(". ")}`;
    }
    
    return analysis.fixSuggestions[0];
  }
  
  return "Try refreshing the page or checking your internet connection. If the problem persists, contact support.";
}

// Function to provide self-help recommendations based on error patterns
export function getSelfHelpRecommendations(recentErrors: EnhancedError[]): {
  title: string;
  description: string;
  steps: string[];
  priority: "high" | "medium" | "low";
}[] {
  const patterns = identifyRecurringPatterns(recentErrors);
  const recommendations = [];
  
  for (const pattern of patterns) {
    // Only provide recommendations for significant patterns
    if (pattern.count >= 3) {
      let priority: "high" | "medium" | "low" = "low";
      
      // Determine priority based on severity and frequency
      if (pattern.severity === ErrorSeverity.CRITICAL || pattern.count > 5) {
        priority = "high";
      } else if (pattern.severity === ErrorSeverity.ERROR || pattern.count > 3) {
        priority = "medium";
      }
      
      recommendations.push({
        title: `Fix for recurring ${pattern.patternName}`,
        description: `This issue has occurred ${pattern.count} times. Here's how to resolve it:`,
        steps: pattern.suggestions,
        priority
      });
    }
  }
  
  return recommendations;
}

// Function to get an immediate fix suggestion for the most recent error
export function getImmediateFixSuggestion(error: EnhancedError): {
  suggestion: string;
  actionable: boolean;
  action?: () => void;
} {
  const analysis = analyzeError(error);
  
  if (!analysis.patternFound) {
    return {
      suggestion: "Try refreshing the page or check your internet connection",
      actionable: true,
      action: () => window.location.reload()
    };
  }
  
  switch (analysis.pattern?.id) {
    case "authentication-expired":
      return {
        suggestion: "Your session has expired. Click here to log in again.",
        actionable: true,
        action: () => {
          // Redirect to login page
          window.location.href = "/auth";
        }
      };
      
    case "network-connectivity":
      return {
        suggestion: "Check your internet connection and try again",
        actionable: true,
        action: () => {
          // Reload the page
          window.location.reload();
        }
      };
      
    case "resource-not-found":
      return {
        suggestion: "The resource was not found. Return to the previous page.",
        actionable: true,
        action: () => {
          // Go back
          window.history.back();
        }
      };
      
    default:
      return {
        suggestion: analysis.fixSuggestions[0],
        actionable: false
      };
  }
}