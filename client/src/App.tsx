import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Tasks from "@/pages/tasks-fixed";
import TasksKanban from "@/pages/tasks-kanban";
import Projects from "@/pages/projects";
import Meetings from "@/pages/meetings";
import Notes from "@/pages/notes";
import Tags from "@/pages/tags";
import AuthPage from "@/pages/auth-page";
import ErrorManagement from "@/pages/error-management";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import { ErrorProvider } from "@/contexts/ErrorContext";
import { QueryErrorResetBoundary } from "@tanstack/react-query";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/tasks" component={Tasks} />
      <ProtectedRoute path="/tasks-kanban" component={TasksKanban} />
      <ProtectedRoute path="/projects" component={Projects} />
      <ProtectedRoute path="/meetings" component={Meetings} />
      <ProtectedRoute path="/notes" component={Notes} />
      <ProtectedRoute path="/tags" component={Tags} />
      <ProtectedRoute path="/error-management" component={ErrorManagement} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorProvider>
      <ErrorBoundary component="App">
        <AuthProvider>
          <QueryErrorResetBoundary>
            {({ reset }) => (
              <ErrorBoundary 
                component="QueryErrorBoundary"
                onError={() => reset()}
              >
                <TooltipProvider>
                  <Toaster />
                  <Router />
                </TooltipProvider>
              </ErrorBoundary>
            )}
          </QueryErrorResetBoundary>
        </AuthProvider>
      </ErrorBoundary>
    </ErrorProvider>
  );
}

export default App;
