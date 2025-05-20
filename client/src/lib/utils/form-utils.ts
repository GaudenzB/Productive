import { z } from "zod";
import { useForm, UseFormReturn, FieldValues, DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useErrorContext } from "@/contexts/ErrorContext";

/**
 * Enhanced form schema validation that adds common patterns
 */
export const formValidation = {
  /**
   * Required field validation with custom message
   */
  required: (message: string = "This field is required") => 
    z.string().min(1, { message }),
  
  /**
   * Email validation
   */
  email: () => 
    z.string().email({ message: "Please enter a valid email address" }),
  
  /**
   * Password validation with strength requirements
   */
  password: (minLength: number = 8) => 
    z.string().min(minLength, { 
      message: `Password must be at least ${minLength} characters long` 
    }),
  
  /**
   * URL validation
   */
  url: (message: string = "Please enter a valid URL") => 
    z.string().url({ message }),
  
  /**
   * Phone number validation (simple pattern)
   */
  phone: () => 
    z.string().regex(/^\+?[0-9\s\-()]{7,}$/, { 
      message: "Please enter a valid phone number" 
    }),
  
  /**
   * Number validation with optional min/max
   */
  number: (options?: { min?: number; max?: number }) => {
    let schema = z.number();
    
    if (options?.min !== undefined) {
      schema = schema.min(options.min, `Must be at least ${options.min}`);
    }
    
    if (options?.max !== undefined) {
      schema = schema.max(options.max, `Must be at most ${options.max}`);
    }
    
    return schema;
  }
};

/**
 * Custom hook to create a form with standardized error handling
 */
export function useAppForm<TFieldValues extends FieldValues = FieldValues, TContext = any>(
  schema: z.ZodType<any, any>,
  defaultValues?: DefaultValues<TFieldValues>,
  onError?: (error: z.ZodError) => void
): UseFormReturn<TFieldValues, TContext> {
  const { toast } = useToast();
  const { logError } = useErrorContext();
  
  // Create form with zod validation
  const form = useForm<TFieldValues>({
    resolver: zodResolver(schema),
    defaultValues,
    // Show validation errors as the user types (after first submit)
    mode: "onTouched",
  });
  
  // Enhance error handling
  const originalHandleSubmit = form.handleSubmit;
  form.handleSubmit = (onValid, onInvalid) => {
    return originalHandleSubmit((data) => {
      return onValid(data);
    }, (errors) => {
      // Get the first error message to show in a toast
      const firstError = Object.entries(errors).find(([_, value]) => value);
      if (firstError) {
        const [field, error] = firstError;
        const message = error?.message || `Invalid value for ${field}`;
        
        toast({
          title: "Validation Error",
          description: message,
          variant: "destructive",
        });
        
        // Log the validation error
        logError(`Form validation error: ${message}`, undefined, {
          component: "Form",
          action: "validate",
          additionalData: { errors }
        });
      }
      
      if (onInvalid) {
        onInvalid(errors);
      }
      
      if (onError && errors) {
        // Create a mock ZodError structure
        const zodError = new z.ZodError([]);
        zodError.errors = Object.entries(errors).map(([path, error]) => ({
          code: "custom",
          path: [path],
          message: error?.message || `Invalid value for ${path}`,
        }));
        onError(zodError);
      }
    });
  };
  
  return form;
}

/**
 * Transform server validation errors into form errors for react-hook-form
 */
export function mapServerErrorsToFormErrors(
  serverErrors: Record<string, string>
): Record<string, { message: string }> {
  return Object.entries(serverErrors).reduce((result, [key, message]) => {
    result[key] = { message };
    return result;
  }, {} as Record<string, { message: string }>);
}

/**
 * Format form data before submission to handle special types
 */
export function formatFormData<T extends Record<string, any>>(data: T): T {
  return Object.entries(data).reduce((result, [key, value]) => {
    // Convert empty strings to null
    if (value === "") {
      result[key] = null;
      return result;
    }
    
    // Format date objects to ISO strings if needed
    if (value instanceof Date) {
      result[key] = value.toISOString();
      return result;
    }
    
    // Pass through other values
    result[key] = value;
    return result;
  }, {} as T);
}