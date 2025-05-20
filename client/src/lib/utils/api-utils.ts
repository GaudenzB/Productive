import { useQuery, useMutation, UseQueryOptions, UseMutationOptions, QueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useApiErrorHandler } from "@/hooks/use-api-error";
import { useToast } from "@/hooks/use-toast";

/**
 * Custom hook for standardized API queries with error handling
 */
export function useApiQuery<TData = unknown, TError = Error>(
  endpoint: string,
  options?: Omit<UseQueryOptions<TData, TError, TData>, "queryKey" | "queryFn">
) {
  const { handleApiError } = useApiErrorHandler();
  
  return useQuery<TData, TError>({
    queryKey: [endpoint],
    ...options,
    onError: (error) => {
      // Handle the error with our standardized error handler
      handleApiError(error, endpoint, "fetch");
      
      // Also call the provided onError if it exists
      if (options?.onError) {
        options.onError(error);
      }
    }
  });
}

/**
 * Custom hook to create a mutation with standardized error and success handling
 */
export function useApiMutation<TData = unknown, TVariables = unknown, TContext = unknown, TError = Error>(
  endpoint: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, "mutationFn">
) {
  const { handleApiError } = useApiErrorHandler();
  const { toast } = useToast();
  
  return useMutation<TData, TError, TVariables, TContext>({
    mutationFn: async (variables: TVariables) => {
      try {
        let url = endpoint;
        
        // Handle ID substitution for resource endpoints (e.g., "/api/tasks/:id")
        if (url.includes(":id") && typeof variables === "object" && variables !== null) {
          const varWithId = variables as any;
          if (varWithId.id) {
            url = url.replace(":id", varWithId.id);
          }
        }
        
        const response = await apiRequest(method, url, variables);
        
        // For DELETE operations, we may not have a response body
        if (method === "DELETE") {
          return {} as TData; 
        }
        
        return await response.json();
      } catch (error) {
        throw handleApiError(error, endpoint, method.toLowerCase());
      }
    },
    ...options,
    onSuccess: (data, variables, context) => {
      // Default success toast if not disabled
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      // The error is already handled in mutationFn
      // Just call the provided onError if it exists
      if (options?.onError) {
        options.onError(error, variables, context);
      }
    }
  });
}

/**
 * Create a standardized API endpoint handler
 */
export function createApiEndpoint<TData = unknown, TCreateData = unknown, TUpdateData = Partial<TData>>(
  endpoint: string,
  queryClient: QueryClient
) {
  const useList = (options?: Omit<UseQueryOptions<TData[], Error, TData[]>, "queryKey" | "queryFn">) => 
    useApiQuery<TData[]>(endpoint, options);
  
  const useDetail = (id: string, options?: Omit<UseQueryOptions<TData, Error, TData>, "queryKey" | "queryFn">) => 
    useApiQuery<TData>(`${endpoint}/${id}`, {
      ...options,
      enabled: !!id && (options?.enabled !== false)
    });
  
  const useCreate = (options?: Omit<UseMutationOptions<TData, Error, TCreateData>, "mutationFn">) => 
    useApiMutation<TData, TCreateData>(endpoint, "POST", {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate the list query when a new item is created
        queryClient.invalidateQueries({ queryKey: [endpoint] });
        
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      }
    });
  
  const useUpdate = (options?: Omit<UseMutationOptions<TData, Error, { id: string; data: TUpdateData }>, "mutationFn">) => 
    useApiMutation<TData, { id: string; data: TUpdateData }>(`${endpoint}/:id`, "PATCH", {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate both the list and the detail query
        queryClient.invalidateQueries({ queryKey: [endpoint] });
        queryClient.invalidateQueries({ queryKey: [`${endpoint}/${variables.id}`] });
        
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      }
    });
  
  const useDelete = (options?: Omit<UseMutationOptions<void, Error, string>, "mutationFn">) => 
    useApiMutation<void, string>(`${endpoint}/:id`, "DELETE", {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate the list query when an item is deleted
        queryClient.invalidateQueries({ queryKey: [endpoint] });
        
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      }
    });
  
  return {
    useList,
    useDetail,
    useCreate,
    useUpdate,
    useDelete
  };
}

/**
 * Helper function to handle pagination parameters
 */
export function getPaginationParams(page: number, limit: number) {
  return {
    limit,
    offset: (page - 1) * limit
  };
}

/**
 * Format API error response for user display
 */
export function formatApiErrorMessage(error: unknown): string {
  if (!error) return "An unknown error occurred";
  
  if (typeof error === "string") return error;
  
  if (error instanceof Error) return error.message;
  
  // Handle API error response objects
  if (typeof error === "object" && error !== null) {
    const anyError = error as any;
    
    if (anyError.message) return anyError.message;
    
    if (anyError.error) {
      if (typeof anyError.error === "string") return anyError.error;
      if (typeof anyError.error === "object" && anyError.error.message) return anyError.error.message;
    }
  }
  
  return "An unexpected error occurred";
}