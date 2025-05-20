import React from "react";
import { 
  AlertTriangle, 
  AlertCircle, 
  X, 
  Terminal, 
  RotateCw, 
  CheckCircle2,
  Clock,
  FileCode,
  Info
} from "lucide-react";
import { EnhancedError, ErrorSeverity } from "@/lib/error-handling";
import { 
  analyzeError, 
  getImmediateFixSuggestion,
  getSelfHelpRecommendations
} from "@/lib/error-pattern-analyzer";

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ErrorSuggestionCardProps {
  error: EnhancedError;
  onClose?: () => void;
  className?: string;
}

export function ErrorSuggestionCard({ 
  error, 
  onClose,
  className = "" 
}: ErrorSuggestionCardProps) {
  // Analyze the error to get intelligent suggestions
  const analysis = analyzeError(error);
  const fixSuggestion = getImmediateFixSuggestion(error);
  const recommendations = getSelfHelpRecommendations([error]);
  
  // Apply the suggested fix
  const handleApplyFix = () => {
    if (fixSuggestion.actionable && fixSuggestion.action) {
      fixSuggestion.action();
    }
  };

  // Function to get the appropriate icon based on error severity
  const getSeverityIcon = () => {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case ErrorSeverity.ERROR:
        return <AlertTriangle className="h-5 w-5 text-destructive/80" />;
      case ErrorSeverity.WARNING:
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case ErrorSeverity.INFO:
      default:
        return <Terminal className="h-5 w-5 text-primary" />;
    }
  };
  
  // Function to get severity text
  const getSeverityText = () => {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return "Critical";
      case ErrorSeverity.ERROR:
        return "Error";
      case ErrorSeverity.WARNING:
        return "Warning";
      case ErrorSeverity.INFO:
        return "Info";
      default:
        return "Unknown";
    }
  };
  
  // Function to get severity badge
  const getSeverityBadge = () => {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return <Badge variant="destructive">Critical</Badge>;
      case ErrorSeverity.ERROR:
        return <Badge variant="destructive">Error</Badge>;
      case ErrorSeverity.WARNING:
        return <Badge variant="outline" className="text-orange-500 border-orange-500">Warning</Badge>;
      case ErrorSeverity.INFO:
        return <Badge variant="secondary">Info</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  return (
    <Card className={`shadow-lg w-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {getSeverityIcon()}
            <div>
              <CardTitle className="text-xl">
                {analysis.patternFound && analysis.pattern 
                  ? analysis.pattern.name 
                  : error.message}
              </CardTitle>
              <CardDescription className="mt-1">
                {analysis.patternFound && analysis.pattern 
                  ? error.message 
                  : `${getSeverityText()} occurred in ${error.context?.component || 'Unknown'}`}
              </CardDescription>
            </div>
          </div>
          {onClose && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Error Details */}
        <div className="bg-muted p-3 rounded-md">
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <div className="text-muted-foreground">Severity:</div>
            <div className="font-medium flex items-center">
              {getSeverityBadge()}
            </div>
            
            <div className="text-muted-foreground">Component:</div>
            <div className="font-medium">
              {error.context?.component || 'Unknown'}
            </div>
            
            {error.context?.action && (
              <>
                <div className="text-muted-foreground">Action:</div>
                <div className="font-medium">{error.context.action}</div>
              </>
            )}
            
            <div className="text-muted-foreground">Time:</div>
            <div className="font-medium">
              {error.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
        
        {/* Immediate Fix Suggestion */}
        {fixSuggestion.actionable && (
          <div className="bg-primary/5 border border-primary/20 p-4 rounded-md">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium text-base">
                  Automatic fix available
                </h3>
                <p className="text-sm mt-1 text-muted-foreground">
                  {fixSuggestion.suggestion}
                </p>
                <Button 
                  onClick={handleApplyFix} 
                  size="sm" 
                  className="mt-3"
                >
                  <RotateCw className="mr-2 h-3.5 w-3.5" />
                  Apply Fix
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Pattern Analysis */}
        {analysis.patternFound && analysis.pattern && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Pattern Analysis</h3>
            <p className="text-sm text-muted-foreground">
              {analysis.pattern.description}
            </p>
            {analysis.fixSuggestions.length > 0 && (
              <div className="mt-2">
                <h4 className="text-xs font-medium uppercase text-muted-foreground mb-1">
                  Suggested fixes:
                </h4>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  {analysis.fixSuggestions.map((suggestion, i) => (
                    <li key={i}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {/* Advanced Details */}
        <Accordion type="single" collapsible className="w-full border rounded-md px-1">
          <AccordionItem value="technical-details" className="border-none">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="text-sm font-medium flex items-center">
                <FileCode className="h-4 w-4 mr-2" />
                Technical Details
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-xs">
              <div className="space-y-2 bg-muted p-3 rounded-md overflow-auto max-h-40">
                <div className="font-mono whitespace-pre-wrap break-all">
                  <div><span className="text-muted-foreground">Error: </span>{error.message}</div>
                  {error.originalError && (
                    <div><span className="text-muted-foreground">Original: </span>{error.originalError.message}</div>
                  )}
                  {error.context?.additionalData && (
                    <div>
                      <span className="text-muted-foreground">Context: </span>
                      {JSON.stringify(error.context.additionalData, null, 2)}
                    </div>
                  )}
                  {error.originalError?.stack && (
                    <div className="mt-2">
                      <span className="text-muted-foreground">Stack: </span>
                      <div className="ml-2 text-[10px] text-muted-foreground">
                        {error.originalError.stack.split('\n').slice(0, 3).join('\n')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
      
      <Separator />
      
      <CardFooter className="pt-4 pb-3">
        <div className="w-full space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">
                Error ID: {error.id.substring(0, 8)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">
                {error.timestamp.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}