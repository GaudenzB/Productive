import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ApiErrorFallbackProps {
  error: Error | null;
  resetError: () => void;
  resource: string;
  isLoading?: boolean;
}

/**
 * Fallback component to display when an API request fails
 * Provides a user-friendly error message and retry button
 */
export function ApiErrorFallback({
  error,
  resetError,
  resource,
  isLoading = false,
}: ApiErrorFallbackProps) {
  const { toast } = useToast();

  const handleRetry = () => {
    toast({
      title: "Retrying...",
      description: `Attempting to fetch ${resource} again.`,
    });
    resetError();
  };

  // Return null when there's no error
  if (!error) {
    return null;
  }

  // Format the error message to be user-friendly
  let errorMessage = "We're having trouble loading this information.";
  
  if (error.message.includes("NetworkError") || error.message.includes("Failed to fetch")) {
    errorMessage = "Unable to connect to the server. Please check your internet connection.";
  } else if (error.message.includes("401") || error.message.includes("Unauthorized")) {
    errorMessage = "Your session may have expired. Please try logging in again.";
  } else if (error.message.includes("403") || error.message.includes("Forbidden")) {
    errorMessage = "You don't have permission to access this resource.";
  } else if (error.message.includes("404") || error.message.includes("Not Found")) {
    errorMessage = `We couldn't find the requested ${resource}.`;
  } else if (error.message.includes("timeout") || error.message.includes("TIMEOUT")) {
    errorMessage = "The request took too long to complete. Please try again.";
  }

  return (
    <div className="w-full p-4 border rounded-md bg-destructive/5 flex flex-col items-center justify-center space-y-4">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <div className="text-center">
        <h3 className="font-semibold text-destructive">Error Loading {resource}</h3>
        <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
      </div>
      <Button 
        variant="outline" 
        className="mt-2 flex items-center gap-2"
        onClick={handleRetry}
        disabled={isLoading}
      >
        {isLoading ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        {isLoading ? "Retrying..." : "Try Again"}
      </Button>
    </div>
  );
}