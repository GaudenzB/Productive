import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { insertUserSchema } from "@shared/schema";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange"
  });

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    console.log("Login form submission:", values);
    console.log("Login attempt with:", { email: values.email });
    loginMutation.mutate(values, {
      onSuccess: (userData) => {
        console.log("Login success in form handler");
        // Navigate immediately after login success
        navigate('/');
      },
      onError: (error) => {
        console.error("Login error in form handler:", error);
      }
    });
  }

  function onRegisterSubmit(values: z.infer<typeof registerSchema>) {
    const { confirmPassword, ...userData } = values;
    registerMutation.mutate(userData, {
      onSuccess: () => {
        navigate('/');
      }
    });
  }

  return (
    <div className="flex min-h-screen bg-secondary">
      <div className="w-full flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">ProductiTask</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6" aria-label="Authentication options">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="login-email">Email</FormLabel>
                          <FormControl>
                            <Input 
                              id="login-email"
                              placeholder="Enter your email"
                              type="email"
                              aria-describedby="login-email-error"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage id="login-email-error" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="login-password">Password</FormLabel>
                          <FormControl>
                            <Input 
                              id="login-password"
                              placeholder="Enter your password" 
                              type="password"
                              aria-describedby="login-password-error"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage id="login-password-error" />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign in"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="register-name">Name</FormLabel>
                          <FormControl>
                            <Input 
                              id="register-name"
                              placeholder="Enter your name"
                              aria-describedby="register-name-error"
                              value={field.value || ""}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                          <FormMessage id="register-name-error" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="register-email">Email</FormLabel>
                          <FormControl>
                            <Input 
                              id="register-email"
                              placeholder="Enter your email"
                              type="email"
                              aria-describedby="register-email-error"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage id="register-email-error" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="register-password">Password</FormLabel>
                          <FormControl>
                            <Input 
                              id="register-password"
                              placeholder="Create a password" 
                              type="password"
                              aria-describedby="register-password-error"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage id="register-password-error" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="register-confirm-password">Confirm Password</FormLabel>
                          <FormControl>
                            <Input 
                              id="register-confirm-password"
                              placeholder="Confirm your password" 
                              type="password"
                              aria-describedby="register-confirm-password-error"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage id="register-confirm-password-error" />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating account..." : "Create account"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="px-6 text-center text-sm text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
