import React, { useState, useEffect } from "react";
import { 
  AlertTriangle, 
  CheckCircle2, 
  BarChart3, 
  Repeat, 
  Clock, 
  AlertCircle,
  Terminal,
  X
} from "lucide-react";
import { EnhancedError, ErrorSeverity } from "@/lib/error-handling";
import { errorTrackingService } from "@/lib/error-service";
import { identifyRecurringPatterns, groupSimilarErrors } from "@/lib/error-pattern-analyzer";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ErrorSuggestionCard } from "./ErrorSuggestionCard";

export function ErrorMonitoringDashboard() {
  const [errors, setErrors] = useState<EnhancedError[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    bySeverity: {
      [ErrorSeverity.INFO]: 0,
      [ErrorSeverity.WARNING]: 0,
      [ErrorSeverity.ERROR]: 0,
      [ErrorSeverity.CRITICAL]: 0,
    }
  });
  const [patterns, setPatterns] = useState<ReturnType<typeof identifyRecurringPatterns>>([]);
  const [selectedError, setSelectedError] = useState<EnhancedError | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Regular refresh of error data
  useEffect(() => {
    const recentErrors = errorTrackingService.getRecentErrors();
    setErrors(recentErrors);
    setStats(errorTrackingService.getErrorStats());
    setPatterns(identifyRecurringPatterns(recentErrors));
    
    const errorListener = (error: EnhancedError) => {
      // Update the dashboard when a new error occurs
      setRefreshKey(prev => prev + 1);
    };
    
    // Register listener for new errors
    const removeListener = errorTrackingService.addErrorListener(errorListener);
    
    // Set up periodic refresh
    const refreshInterval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 30000); // Refresh every 30 seconds
    
    return () => {
      removeListener();
      clearInterval(refreshInterval);
    };
  }, [refreshKey]);
  
  // Calculate percentages for the severity distribution chart
  const calculatePercentage = (count: number) => {
    return stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
  };
  
  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return "text-destructive";
      case ErrorSeverity.ERROR:
        return "text-destructive/80";
      case ErrorSeverity.WARNING:
        return "text-warning";
      case ErrorSeverity.INFO:
      default:
        return "text-primary";
    }
  };
  
  const getSeverityBadge = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return <Badge variant="destructive">Critical</Badge>;
      case ErrorSeverity.ERROR:
        return <Badge variant="destructive">Error</Badge>;
      case ErrorSeverity.WARNING:
        return <Badge variant="warning">Warning</Badge>;
      case ErrorSeverity.INFO:
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };
  
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) {
      return "Just now";
    } else if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    } else if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Error Monitoring</h2>
          <p className="text-muted-foreground">
            Track, analyze, and resolve application errors
          </p>
        </div>
        <Button onClick={() => setRefreshKey(prev => prev + 1)}>
          <Repeat className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        {/* Error counts by severity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Error Distribution
            </CardTitle>
            <CardDescription>
              Errors by severity level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-destructive" />
                    <span className="text-xs">Critical</span>
                  </div>
                  <span className="text-xs">{stats.bySeverity[ErrorSeverity.CRITICAL]}</span>
                </div>
                <Progress value={calculatePercentage(stats.bySeverity[ErrorSeverity.CRITICAL])} className="h-1 bg-destructive/20" indicatorClassName="bg-destructive" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-destructive/80" />
                    <span className="text-xs">Error</span>
                  </div>
                  <span className="text-xs">{stats.bySeverity[ErrorSeverity.ERROR]}</span>
                </div>
                <Progress value={calculatePercentage(stats.bySeverity[ErrorSeverity.ERROR])} className="h-1 bg-destructive/10" indicatorClassName="bg-destructive/80" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-warning" />
                    <span className="text-xs">Warning</span>
                  </div>
                  <span className="text-xs">{stats.bySeverity[ErrorSeverity.WARNING]}</span>
                </div>
                <Progress value={calculatePercentage(stats.bySeverity[ErrorSeverity.WARNING])} className="h-1 bg-warning/20" indicatorClassName="bg-warning" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Terminal className="h-3 w-3 text-primary" />
                    <span className="text-xs">Info</span>
                  </div>
                  <span className="text-xs">{stats.bySeverity[ErrorSeverity.INFO]}</span>
                </div>
                <Progress value={calculatePercentage(stats.bySeverity[ErrorSeverity.INFO])} className="h-1 bg-primary/20" indicatorClassName="bg-primary" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-muted-foreground">
              Total: {stats.total} errors tracked
            </p>
          </CardFooter>
        </Card>
        
        {/* Top recurring error patterns */}
        <Card className="col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Recurring Error Patterns
            </CardTitle>
            <CardDescription>
              {patterns.length > 0 
                ? "Patterns detected that may need attention" 
                : "No recurring error patterns detected"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {patterns.length > 0 ? (
              <div className="space-y-2">
                {patterns.slice(0, 3).map((pattern, index) => (
                  <div key={index} className="flex items-start justify-between p-2 rounded-md bg-muted">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={pattern.severity === ErrorSeverity.CRITICAL || pattern.severity === ErrorSeverity.ERROR 
                            ? "destructive" 
                            : "outline"}
                        >
                          {pattern.count}x
                        </Badge>
                        <h4 className="text-sm font-medium">{pattern.patternName}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {pattern.suggestions[0]}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Fix
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-24 bg-muted rounded-md">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>No recurring patterns found</span>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-muted-foreground">
              Based on analysis of {stats.total} recent errors
            </p>
          </CardFooter>
        </Card>
      </div>
      
      {/* Detailed error tabs and info */}
      <Tabs defaultValue="recent">
        <TabsList>
          <TabsTrigger value="recent">Recent Errors</TabsTrigger>
          <TabsTrigger value="patterns">Pattern Analysis</TabsTrigger>
          {selectedError && <TabsTrigger value="details">Error Details</TabsTrigger>}
        </TabsList>
        
        {/* Recent Errors Tab */}
        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors</CardTitle>
              <CardDescription>
                The most recent errors captured by the application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {errors.length > 0 ? (
                    errors.map((error, index) => (
                      <div key={index} className="flex items-start justify-between p-3 rounded-md hover:bg-muted">
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 ${getSeverityColor(error.severity)}`}>
                            {error.severity === ErrorSeverity.CRITICAL ? (
                              <AlertCircle className="h-4 w-4" />
                            ) : error.severity === ErrorSeverity.ERROR ? (
                              <AlertTriangle className="h-4 w-4" />
                            ) : error.severity === ErrorSeverity.WARNING ? (
                              <AlertTriangle className="h-4 w-4" />
                            ) : (
                              <Terminal className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium">{error.message}</h4>
                              {getSeverityBadge(error.severity)}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>{error.context?.component || "Unknown"}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimestamp(error.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedError(error)}
                        >
                          View
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-24">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>No errors recorded</span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Pattern Analysis Tab */}
        <TabsContent value="patterns">
          <Card>
            <CardHeader>
              <CardTitle>Error Pattern Analysis</CardTitle>
              <CardDescription>
                Identified patterns and suggested solutions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {patterns.length > 0 ? (
                    patterns.map((pattern, index) => (
                      <div key={index} className="p-4 rounded-md border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            <h3 className="font-medium">{pattern.patternName}</h3>
                            <Badge 
                              variant={pattern.severity === ErrorSeverity.CRITICAL || pattern.severity === ErrorSeverity.ERROR 
                                ? "destructive" 
                                : "outline"}
                            >
                              {pattern.count}x
                            </Badge>
                          </div>
                          <Badge 
                            variant={
                              pattern.count > 5 ? "destructive" : 
                              pattern.count > 3 ? "warning" : "outline"
                            }
                          >
                            {pattern.count > 5 ? "High" : pattern.count > 3 ? "Medium" : "Low"} Frequency
                          </Badge>
                        </div>
                        <Separator className="my-2" />
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Suggested fixes:</h4>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {pattern.suggestions.map((suggestion, i) => (
                              <li key={i} className="text-muted-foreground">{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-24">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>No error patterns detected</span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Error Details Tab */}
        {selectedError && (
          <TabsContent value="details">
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 z-10"
                onClick={() => setSelectedError(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              <ErrorSuggestionCard error={selectedError} />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}