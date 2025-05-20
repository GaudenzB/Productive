import React, { useState, useEffect } from "react";
import { AlertTriangle, AlertCircle, Info, CheckCircle2, RefreshCw, X } from "lucide-react";
import { EnhancedError, ErrorSeverity } from "@/lib/error-handling";
import { 
  analyzeError, 
  getImmediateFixSuggestion,
  getSelfHelpRecommendations
} from "@/lib/error-pattern-analyzer";
import { errorTrackingService } from "@/lib/error-service";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ErrorSuggestionCardProps {
  error: EnhancedError;
  onClose?: () => void;
  className?: string;
}

export function ErrorSuggestionCard({ error, onClose, className }: ErrorSuggestionCardProps) {
  const [analysis, setAnalysis] = useState(() => analyzeError(error));
  const [immediateFix, setImmediateFix] = useState(() => getImmediateFixSuggestion(error));
  const [recommendations, setRecommendations] = useState<ReturnType<typeof getSelfHelpRecommendations>>([]);
  
  useEffect(() => {
    // Update analysis when error changes
    setAnalysis(analyzeError(error));
    setImmediateFix(getImmediateFixSuggestion(error));
    
    // Get recommendations based on recent errors
    const recentErrors = errorTrackingService.getRecentErrors();
    setRecommendations(getSelfHelpRecommendations(recentErrors));
  }, [error]);
  
  // Get the appropriate icon based on error severity
  const renderIcon = () => {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return <AlertCircle className="h-6 w-6 text-destructive" />;
      case ErrorSeverity.ERROR:
        return <AlertTriangle className="h-6 w-6 text-destructive" />;
      case ErrorSeverity.WARNING:
        return <AlertTriangle className="h-6 w-6 text-warning" />;
      case ErrorSeverity.INFO:
      default:
        return <Info className="h-6 w-6 text-primary" />;
    }
  };
  
  // Get card styling based on error severity
  const getCardStyle = () => {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return "border-destructive shadow-md";
      case ErrorSeverity.ERROR:
        return "border-destructive/70 shadow-sm";
      case ErrorSeverity.WARNING:
        return "border-warning/70";
      case ErrorSeverity.INFO:
      default:
        return "border-primary/20";
    }
  };
  
  return (
    <Card className={`${getCardStyle()} ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {renderIcon()}
            <CardTitle className="text-lg">
              {analysis.patternFound && analysis.pattern 
                ? analysis.pattern.name 
                : "Unexpected Error"}
            </CardTitle>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          )}
        </div>
        <CardDescription>
          {error.message}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Immediate fix suggestion */}
          <div className="rounded-md bg-muted p-3">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium">Suggested Fix</h3>
                <div className="mt-1 text-sm">
                  <p>{immediateFix.suggestion}</p>
                </div>
                {immediateFix.actionable && (
                  <div className="mt-2">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={immediateFix.action}
                    >
                      <RefreshCw className="mr-2 h-3 w-3" />
                      Fix now
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Detailed information */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="details">
              <AccordionTrigger className="text-sm">More details</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Error Code:</span>{" "}
                    {error.code || "Unknown"}
                  </div>
                  <div>
                    <span className="font-medium">Occurred in:</span>{" "}
                    {error.context?.component || "Unknown location"}
                  </div>
                  <div>
                    <span className="font-medium">Action:</span>{" "}
                    {error.context?.action || "Unknown action"}
                  </div>
                  <div>
                    <span className="font-medium">Time:</span>{" "}
                    {error.timestamp.toLocaleTimeString()}
                  </div>
                  {error.context?.additionalData && Object.keys(error.context.additionalData).length > 0 && (
                    <div>
                      <span className="font-medium">Additional Info:</span>{" "}
                      {Object.entries(error.context.additionalData).map(([key, value]) => (
                        <Badge key={key} variant="outline" className="mr-1">
                          {key}: {String(value)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            {/* Contextual help */}
            {analysis.contextualHelp && (
              <AccordionItem value="help">
                <AccordionTrigger className="text-sm">Help & Information</AccordionTrigger>
                <AccordionContent>
                  <div 
                    className="text-sm"
                    dangerouslySetInnerHTML={{ __html: analysis.contextualHelp.replace(
                      /\*\*(.*?)\*\*/g, '<strong>$1</strong>'
                    ).replace(
                      /\[([^\]]+)\]\(([^)]+)\)/g, 
                      '<a href="$2" class="text-primary hover:underline">$1</a>'
                    ) }}
                  />
                </AccordionContent>
              </AccordionItem>
            )}
            
            {/* Additional suggestions if we have recurring patterns */}
            {recommendations.length > 0 && (
              <AccordionItem value="patterns">
                <AccordionTrigger className="text-sm">
                  {recommendations.some(r => r.priority === "high") ? (
                    <span className="flex items-center">
                      Recurring Issues
                      <Badge variant="destructive" className="ml-2">Important</Badge>
                    </span>
                  ) : "Recurring Issues"}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    {recommendations.map((rec, idx) => (
                      <div key={idx} className={`p-2 rounded-md ${
                        rec.priority === "high" 
                          ? "bg-destructive/10" 
                          : rec.priority === "medium" 
                              ? "bg-warning/10" 
                              : "bg-muted"
                      }`}>
                        <h4 className="text-sm font-medium">{rec.title}</h4>
                        <p className="text-xs text-muted-foreground">{rec.description}</p>
                        <ul className="mt-1 list-disc list-inside text-xs space-y-1">
                          {rec.steps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-0">
        <div className="text-xs text-muted-foreground">
          {analysis.patternFound ? (
            <span>
              Pattern detected with {analysis.confidence}% confidence
            </span>
          ) : (
            <span>No specific error pattern detected</span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-3 w-3" />
          Reload page
        </Button>
      </CardFooter>
    </Card>
  );
}