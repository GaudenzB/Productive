/**
 * Extended types for UI components that need additional properties
 * beyond what's provided by the default shadcn components
 */

import { ButtonProps } from "@/components/ui/button";
import { BadgeProps } from "@/components/ui/badge";
import * as React from "react";

/**
 * Extended Progress component props with support for indicator class name
 */
export interface ExtendedProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * CSS class name applied to the indicator element of the progress bar
   */
  indicatorClassName?: string;
  value?: number;
  max?: number;
  className?: string;
}

/**
 * Extended Badge component props with additional variants
 */
export interface ExtendedBadgeProps {
  /**
   * Extended variant options for badge styling
   */
  variant?: "default" | "secondary" | "destructive" | "outline" | "warning";
  className?: string;
  children?: React.ReactNode;
}

/**
 * Type definitions for error handling and pattern recognition
 */

/**
 * Error suggestion result from pattern analysis
 */
export interface ErrorFixSuggestion {
  actionable: boolean;
  suggestion: string;
  action?: () => void;
}

/**
 * Recognized error pattern details
 */
export interface ErrorPattern {
  name: string;
  description: string;
  patternSignature: string[];
  fixes: string[];
}

/**
 * Error pattern analysis result
 */
export interface ErrorAnalysisResult {
  patternFound: boolean;
  pattern?: ErrorPattern;
  fixSuggestions: string[];
  severity: string;
  frequency?: number;
}

/**
 * Recognized recurring error pattern
 */
export interface RecurringErrorPattern {
  patternName: string;
  count: number;
  severity: string;
  suggestions: string[];
}

/**
 * Self-help recommendation for error patterns
 */
export interface ErrorRecommendation {
  title: string;
  description: string;
  steps: string[];
  priority: 'low' | 'medium' | 'high';
}