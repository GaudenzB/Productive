import React, { useState } from "react";
import { EnhancedError, ErrorSeverity, createError } from "@/lib/error-handling";
import { errorTrackingService } from "@/lib/error-service";
import { EnhancedErrorBoundary } from "@/components/error/EnhancedErrorBoundary";
import { ErrorMonitoringDashboard } from "@/components/error/ErrorMonitoringDashboard";
import { ErrorNotification } from "@/components/error/ErrorNotification";
import { useErrorRecognition } from "@/hooks/use-error-recognition";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, AlertTriangle, AlertCircle, Bug, Repeat, ShieldAlert } from "lucide-react";

// Component that will intentionally throw errors
const ErrorThrower = ({ type }: { type: string }) => {
  if (type === 'render') {
    throw new Error("Intentional render error for testing");
  }
  
  return (
    <div>This component only renders if no error is thrown</div>
  );
};

// Component to demonstrate error handling with recovery suggestions
const ErrorManagementPage = () => {
  const [currentError, setCurrentError] = useState<EnhancedError | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const errorRecognition = useErrorRecognition({ 
    notifyOnHighPriorityPatterns: true, 
    autoFixEnabled: false 
  });
  
  // Function to create various sample errors
  const generateError = (type: string) => {
    // Create a different type of error based on the parameter
    let error: EnhancedError;
    
    switch (type) {
      case 'network':
        error = createError(
          "Failed to fetch data: Network error",
          ErrorSeverity.ERROR,
          {
            component: "API Client",
            action: "fetchData",
            additionalData: { endpoint: "/api/data", statusCode: 0 }
          },
          new Error("Network request failed")
        );
        break;
        
      case 'unauthorized':
        error = createError(
          "Authentication required to access this resource",
          ErrorSeverity.WARNING,
          {
            component: "AuthService",
            action: "checkAccess",
            additionalData: { statusCode: 401, resource: "tasks" }
          },
          new Error("Unauthorized access")
        );
        break;
        
      case 'validation':
        error = createError(
          "Invalid input: Required fields are missing",
          ErrorSeverity.WARNING,
          {
            component: "Form",
            action: "submitForm",
            additionalData: { 
              fields: { 
                name: "Name is required", 
                email: "Email is not valid" 
              },
              statusCode: 400
            }
          },
          new Error("Validation error")
        );
        break;
        
      case 'notfound':
        error = createError(
          "The requested resource could not be found",
          ErrorSeverity.ERROR,
          {
            component: "ResourceLoader",
            action: "getResource",
            additionalData: { 
              resourceId: "task-12345",
              statusCode: 404
            }
          },
          new Error("Resource not found")
        );
        break;
        
      case 'server':
        error = createError(
          "Internal server error occurred while processing your request",
          ErrorSeverity.CRITICAL,
          {
            component: "ServerAPI",
            action: "processData",
            additionalData: { 
              operationId: "data-process-789",
              statusCode: 500
            }
          },
          new Error("Internal Server Error")
        );
        break;
        
      case 'permission':
        error = createError(
          "You don't have permission to perform this action",
          ErrorSeverity.ERROR,
          {
            component: "PermissionService",
            action: "deleteResource",
            additionalData: { 
              resourceType: "Project",
              statusCode: 403,
              requiredRole: "admin"
            }
          },
          new Error("Forbidden")
        );
        break;
        
      default:
        error = createError(
          "An unexpected error occurred",
          ErrorSeverity.ERROR,
          {
            component: "Application",
            action: "performAction"
          },
          new Error("Unknown error")
        );
    }
    
    // Track the error in our error service
    errorTrackingService.trackError(error);
    setCurrentError(error);
    setErrorCount(prev => prev + 1);
    
    // Use our error recognition system to analyze and handle the error
    errorRecognition.handleError(error);
  };
  
  // Function to generate multiple errors of the same type to trigger pattern recognition
  const generateMultipleErrors = (type: string, count: number = 3) => {
    for (let i = 0; i < count; i++) {
      generateError(type);
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Error Management System</h1>
        <p className="text-muted-foreground mt-2">
          This page demonstrates the automated error pattern recognition and recovery suggestion system.
        </p>
      </div>
      
      <Tabs defaultValue="demo">
        <TabsList>
          <TabsTrigger value="demo">Error Demo</TabsTrigger>
          <TabsTrigger value="monitoring">Error Monitoring</TabsTrigger>
          <TabsTrigger value="boundary">Error Boundary</TabsTrigger>
        </TabsList>
        
        <TabsContent value="demo" className="space-y-4 mt-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Error Demonstration</AlertTitle>
            <AlertDescription>
              Generate different types of errors to see how the system recognizes patterns and suggests fixes.
              Try generating the same error multiple times to trigger pattern recognition.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Network Errors</CardTitle>
                <CardDescription>Simulate connectivity issues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => generateError('network')}>
                    <Bug className="mr-2 h-4 w-4" />
                    Generate Network Error
                  </Button>
                  <Button variant="outline" onClick={() => generateMultipleErrors('network')}>
                    <Repeat className="mr-2 h-4 w-4" />
                    Generate Multiple (3x)
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Authentication Errors</CardTitle>
                <CardDescription>Simulate auth failures</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => generateError('unauthorized')}>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Generate Auth Error
                  </Button>
                  <Button variant="outline" onClick={() => generateMultipleErrors('unauthorized')}>
                    <Repeat className="mr-2 h-4 w-4" />
                    Generate Multiple (3x)
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Validation Errors</CardTitle>
                <CardDescription>Simulate form validation issues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => generateError('validation')}>
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    Generate Validation Error
                  </Button>
                  <Button variant="outline" onClick={() => generateMultipleErrors('validation')}>
                    <Repeat className="mr-2 h-4 w-4" />
                    Generate Multiple (3x)
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Not Found Errors</CardTitle>
                <CardDescription>Simulate missing resources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => generateError('notfound')}>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Generate Not Found Error
                  </Button>
                  <Button variant="outline" onClick={() => generateMultipleErrors('notfound')}>
                    <Repeat className="mr-2 h-4 w-4" />
                    Generate Multiple (3x)
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Server Errors</CardTitle>
                <CardDescription>Simulate backend failures</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => generateError('server')}>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Generate Server Error
                  </Button>
                  <Button variant="outline" onClick={() => generateMultipleErrors('server')}>
                    <Repeat className="mr-2 h-4 w-4" />
                    Generate Multiple (3x)
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Permission Errors</CardTitle>
                <CardDescription>Simulate access restriction issues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => generateError('permission')}>
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    Generate Permission Error
                  </Button>
                  <Button variant="outline" onClick={() => generateMultipleErrors('permission')}>
                    <Repeat className="mr-2 h-4 w-4" />
                    Generate Multiple (3x)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Current Error</h2>
            {currentError ? (
              <ErrorNotification error={currentError} showDetailedCard />
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>No errors yet</AlertTitle>
                <AlertDescription>
                  Generate an error above to see how the system recognizes and suggests fixes.
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Error Stats</h2>
            <div className="bg-muted p-4 rounded-md">
              <p>Total errors generated: {errorCount}</p>
              <p>Pattern suggestions available: {errorRecognition.patternSuggestions.length}</p>
              <p>Recurring patterns detected: {errorRecognition.recurringPatterns.length}</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="monitoring" className="mt-4">
          <ErrorMonitoringDashboard />
        </TabsContent>
        
        <TabsContent value="boundary" className="space-y-4 mt-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Error Boundary Demo</AlertTitle>
            <AlertDescription>
              This demonstrates how the EnhancedErrorBoundary component catches rendering errors
              and provides intelligent recovery options.
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardHeader>
              <CardTitle>Error Boundary Test</CardTitle>
              <CardDescription>
                Click the button to render a component that will throw an error
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedErrorBoundary
                component="ErrorThrower"
                showNotification={true}
              >
                {currentError?.message?.includes('render') ? (
                  <ErrorThrower type="render" />
                ) : (
                  <div className="flex flex-col gap-4">
                    <p>This component is protected by an Error Boundary.</p>
                    <p>If it throws an error during rendering, the boundary will catch it and show recovery options.</p>
                    <Button onClick={() => setCurrentError(createError(
                      "Intentional render error for testing",
                      ErrorSeverity.ERROR,
                      { component: "ErrorThrower", action: "render" }
                    ))}>
                      Trigger Render Error
                    </Button>
                  </div>
                )}
              </EnhancedErrorBoundary>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ErrorManagementPage;