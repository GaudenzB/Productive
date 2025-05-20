import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { InsertTask, Task, Project } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { CalendarIcon, Plus, Filter, Search, Loader2 } from "lucide-react";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import { ApiErrorFallback } from "@/components/error/ApiErrorFallback";
import { useApiErrorHandler } from "@/hooks/use-api-error";
import { useErrorContext } from "@/contexts/ErrorContext";

// Task form schema
const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  dueDate: z.date().optional().nullable(),
  projectId: z.string().optional().nullable(),
});

export default function Tasks() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { toast } = useToast();
  const { logInfo } = useErrorContext();
  const { handleApiError } = useApiErrorHandler();
  const queryClient = useQueryClient();
  
  // Log info for user actions for analytics
  const logUserAction = (action: string, details?: Record<string, unknown>) => {
    logInfo(`User ${action}`, { component: 'Tasks', action, additionalData: details });
  };
  
  // Queries with error handling
  const { 
    data: tasks, 
    isLoading: isLoadingTasks, 
    error: tasksError,
    refetch: refetchTasks
  } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    onError: (error) => {
      handleApiError(error, 'tasks', 'fetch');
    }
  });
  
  const { 
    data: projects,
    error: projectsError,
    refetch: refetchProjects
  } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    onError: (error) => {
      handleApiError(error, 'projects', 'fetch');
    }
  });
  
  // Create filtered tasks
  const filteredTasks = tasks ? tasks.filter(task => {
    // Match search query
    const matchesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    
    // Match status filter
    const matchesStatus = !statusFilter || task.status === statusFilter;
    
    // Match priority filter
    const matchesPriority = !priorityFilter || task.priority === priorityFilter;
    
    // Match project filter
    const matchesProject = !projectFilter || task.projectId === projectFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  }) : [];
  
  // Create Task Form
  const createForm = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: null,
      projectId: null,
    },
  });
  
  // Edit Task Form
  const editForm = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: null,
      projectId: null,
    },
  });
  
  // Mutations with enhanced error handling
  const createTaskMutation = useMutation({
    mutationFn: async (data: InsertTask) => {
      try {
        const res = await apiRequest("POST", "/api/tasks", data);
        return await res.json();
      } catch (error) {
        // Enhanced error handling with context
        throw handleApiError(error, 'tasks', 'create', 'Failed to create task');
      }
    },
    onSuccess: () => {
      // Refresh the task list
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      
      // Reset and close the form
      setIsCreateDialogOpen(false);
      createForm.reset({
        title: "",
        description: "",
        status: "TODO",
        priority: "MEDIUM",
        dueDate: null,
        projectId: null,
      });
      
      // Log successful creation for analytics
      logUserAction('created task');
      
      toast({
        title: "Task created",
        description: "Your task has been created successfully.",
      });
    },
    onError: (error) => {
      // Error is already handled in mutationFn
      console.debug('Task creation error already handled in mutationFn');
    },
  });
  
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Task> }) => {
      try {
        const res = await apiRequest("PATCH", `/api/tasks/${id}`, data);
        return await res.json();
      } catch (error) {
        throw handleApiError(error, 'tasks', 'update', `Failed to update task #${id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setSelectedTask(null);
      setIsEditDialogOpen(false);
      
      // Log successful update for analytics
      logUserAction('updated task', { taskId: selectedTask?.id });
      
      toast({
        title: "Task updated",
        description: "Your task has been updated successfully.",
      });
    },
    onError: (error) => {
      // Error is already handled in mutationFn
      console.debug('Task update error already handled in mutationFn');
    },
  });
  
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await apiRequest("DELETE", `/api/tasks/${id}`);
      } catch (error) {
        throw handleApiError(error, 'tasks', 'delete', `Failed to delete task #${id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setSelectedTask(null);
      setIsEditDialogOpen(false);
      
      // Log successful deletion for analytics
      logUserAction('deleted task', { taskId: selectedTask?.id });
      
      toast({
        title: "Task deleted",
        description: "Your task has been deleted successfully.",
      });
    },
    onError: (error) => {
      // Error is already handled in mutationFn
      console.debug('Task deletion error already handled in mutationFn');
    },
  });
  
  // Handlers
  const onCreateSubmit = (data: z.infer<typeof taskFormSchema>) => {
    createTaskMutation.mutate(data as InsertTask);
  };
  
  const onUpdateSubmit = (data: z.infer<typeof taskFormSchema>) => {
    if (selectedTask) {
      updateTaskMutation.mutate({ id: selectedTask.id, data });
    }
  };
  
  const onTaskSelect = (task: Task) => {
    setSelectedTask(task);
    setIsEditDialogOpen(true);
    
    // Log user viewing task details for analytics
    logUserAction('viewed task details', { taskId: task.id });
    
    // Ensure task status is one of the valid enum values
    const status = (task.status === "TODO" || task.status === "IN_PROGRESS" || task.status === "COMPLETED") 
      ? task.status 
      : "TODO";
    
    // Ensure priority is one of the valid enum values
    const priority = (task.priority === "LOW" || task.priority === "MEDIUM" || task.priority === "HIGH")
      ? task.priority
      : "MEDIUM";
      
    editForm.reset({
      title: task.title,
      description: task.description || "",
      status: status as "TODO" | "IN_PROGRESS" | "COMPLETED",
      priority: priority as "LOW" | "MEDIUM" | "HIGH",
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      projectId: task.projectId,
    });
  };
  
  const onStatusChange = (taskId: string, completed: boolean) => {
    updateTaskMutation.mutate({
      id: taskId,
      data: { status: completed ? "COMPLETED" : "TODO" },
    });
  };
  
  // Helper to get project name from project ID
  const getProjectName = (projectId: string | null) => {
    if (!projectId || !projects) return "None";
    const project = projects.find(p => p.id === projectId);
    return project ? project.title : "None";
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen overflow-hidden">
        <Header onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-secondary">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-2xl font-bold">Tasks</h1>
            
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto mt-4 md:mt-0">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search tasks..." 
                  className="pl-8" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search tasks"
                />
              </div>
              
              {/* Filter Dialog */}
              <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-1">
                    <Filter className="h-4 w-4" /> Filter
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md" aria-describedby="filter-dialog-description">
                  <DialogHeader>
                    <DialogTitle>Filter Tasks</DialogTitle>
                    <p id="filter-dialog-description" className="text-sm text-muted-foreground">
                      Filter your tasks by status, priority, and project.
                    </p>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Status</h4>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant={statusFilter === null ? "default" : "outline"} 
                          size="sm" 
                          onClick={() => setStatusFilter(null)}
                        >
                          All
                        </Button>
                        <Button 
                          variant={statusFilter === "TODO" ? "default" : "outline"} 
                          size="sm" 
                          onClick={() => setStatusFilter("TODO")}
                        >
                          To Do
                        </Button>
                        <Button 
                          variant={statusFilter === "IN_PROGRESS" ? "default" : "outline"} 
                          size="sm" 
                          onClick={() => setStatusFilter("IN_PROGRESS")}
                        >
                          In Progress
                        </Button>
                        <Button 
                          variant={statusFilter === "COMPLETED" ? "default" : "outline"} 
                          size="sm" 
                          onClick={() => setStatusFilter("COMPLETED")}
                        >
                          Completed
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Priority</h4>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant={priorityFilter === null ? "default" : "outline"} 
                          size="sm" 
                          onClick={() => setPriorityFilter(null)}
                        >
                          All
                        </Button>
                        <Button 
                          variant={priorityFilter === "HIGH" ? "default" : "outline"} 
                          size="sm" 
                          onClick={() => setPriorityFilter("HIGH")}
                        >
                          High
                        </Button>
                        <Button 
                          variant={priorityFilter === "MEDIUM" ? "default" : "outline"} 
                          size="sm" 
                          onClick={() => setPriorityFilter("MEDIUM")}
                        >
                          Medium
                        </Button>
                        <Button 
                          variant={priorityFilter === "LOW" ? "default" : "outline"} 
                          size="sm" 
                          onClick={() => setPriorityFilter("LOW")}
                        >
                          Low
                        </Button>
                      </div>
                    </div>
                    
                    <ErrorBoundary component="ProjectsFilterList">
                      {projects && projects.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Project</h4>
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              variant={projectFilter === null ? "default" : "outline"} 
                              size="sm" 
                              onClick={() => setProjectFilter(null)}
                            >
                              All
                            </Button>
                            {projects.map((project) => (
                              <Button 
                                key={project.id}
                                variant={projectFilter === project.id ? "default" : "outline"} 
                                size="sm" 
                                onClick={() => setProjectFilter(project.id)}
                              >
                                {project.title}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </ErrorBoundary>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setStatusFilter(null);
                        setPriorityFilter(null);
                        setProjectFilter(null);
                        setIsFilterOpen(false);
                        logUserAction('reset filters');
                      }}
                    >
                      Reset Filters
                    </Button>
                    <Button 
                      type="button" 
                      onClick={() => {
                        setIsFilterOpen(false);
                        logUserAction('applied filters', { 
                          statusFilter, 
                          priorityFilter, 
                          projectFilter 
                        });
                      }}
                    >
                      Apply Filters
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              {/* Create Task Dialog */}
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-1">
                    <Plus className="h-4 w-4" /> New Task
                  </Button>
                </DialogTrigger>
                <DialogContent aria-describedby="task-dialog-description">
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <p id="task-dialog-description" className="text-sm text-muted-foreground">
                      Add a new task to your productivity list.
                    </p>
                  </DialogHeader>
                  <Form {...createForm}>
                    <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                      <FormField
                        control={createForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Task title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={createForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Task description" className="min-h-24 resize-none" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={createForm.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="TODO">To Do</SelectItem>
                                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                  <SelectItem value="COMPLETED">Completed</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={createForm.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Priority</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a priority" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="LOW">Low</SelectItem>
                                  <SelectItem value="MEDIUM">Medium</SelectItem>
                                  <SelectItem value="HIGH">High</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={createForm.control}
                          name="dueDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Due Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value || undefined}
                                    onSelect={field.onChange}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <ErrorBoundary component="ProjectSelectField">
                          <FormField
                            control={createForm.control}
                            name="projectId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Project</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value || undefined}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a project" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="">None</SelectItem>
                                    {projects?.map((project) => (
                                      <SelectItem key={project.id} value={project.id}>
                                        {project.title}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </ErrorBoundary>
                      </div>
                      
                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreateDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createTaskMutation.isPending}
                        >
                          {createTaskMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Create Task
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Error States */}
          {tasksError && (
            <ErrorBoundary component="TasksErrorBoundary">
              <ApiErrorFallback 
                error={tasksError instanceof Error ? tasksError : new Error(String(tasksError))}
                resetError={() => refetchTasks()}
                resource="tasks"
                isLoading={isLoadingTasks}
              />
            </ErrorBoundary>
          )}
          
          {/* Loading State */}
          {isLoadingTasks && !tasksError && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-lg">Loading tasks...</span>
            </div>
          )}
          
          {/* Empty State */}
          {!isLoadingTasks && !tasksError && filteredTasks.length === 0 && (
            <div className="bg-card rounded-lg border shadow-sm p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || statusFilter || priorityFilter || projectFilter
                  ? "Try adjusting your filters or search criteria"
                  : "Get started by creating your first task"}
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Create New Task
              </Button>
            </div>
          )}
          
          {/* Tasks Grid */}
          {!isLoadingTasks && !tasksError && filteredTasks.length > 0 && (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredTasks.map((task) => (
                <Card 
                  key={task.id} 
                  className="hover:shadow-md transition-shadow duration-200"
                  onClick={() => onTaskSelect(task)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center">
                        <Checkbox
                          checked={task.status === "COMPLETED"}
                          onCheckedChange={(checked) => {
                            onStatusChange(task.id, checked === true);
                            // Stop propagation to prevent opening task dialog
                            event?.stopPropagation();
                          }}
                          className="mr-2"
                          aria-label={`Mark "${task.title}" as ${task.status === "COMPLETED" ? "incomplete" : "complete"}`}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <h3 className={cn(
                          "font-medium text-base",
                          task.status === "COMPLETED" && "line-through text-muted-foreground"
                        )}>
                          {task.title}
                        </h3>
                      </div>
                      <PriorityBadge priority={task.priority} />
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                      {task.dueDate ? (
                        <span>Due: {format(new Date(task.dueDate), "MMM d, yyyy")}</span>
                      ) : (
                        <span>No due date</span>
                      )}
                      
                      <ErrorBoundary component="TaskProjectDisplay">
                        <span>Project: {getProjectName(task.projectId)}</span>
                      </ErrorBoundary>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* Edit Task Dialog */}
          {selectedTask && (
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent aria-describedby="edit-task-dialog-description">
                <DialogHeader>
                  <DialogTitle>Edit Task</DialogTitle>
                  <p id="edit-task-dialog-description" className="text-sm text-muted-foreground">
                    Update the details of your task.
                  </p>
                </DialogHeader>
                <Form {...editForm}>
                  <form onSubmit={editForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
                    <FormField
                      control={editForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Task title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Task description" className="min-h-24 resize-none" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={editForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="TODO">To Do</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="LOW">Low</SelectItem>
                                <SelectItem value="MEDIUM">Medium</SelectItem>
                                <SelectItem value="HIGH">High</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={editForm.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Due Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value || undefined}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <ErrorBoundary component="EditProjectSelectField">
                        <FormField
                          control={editForm.control}
                          name="projectId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Project</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a project" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="">None</SelectItem>
                                  {projects?.map((project) => (
                                    <SelectItem key={project.id} value={project.id}>
                                      {project.title}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </ErrorBoundary>
                    </div>
                    
                    <div className="flex justify-between pt-4">
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this task?")) {
                            deleteTaskMutation.mutate(selectedTask.id);
                          }
                        }}
                        disabled={deleteTaskMutation.isPending}
                      >
                        {deleteTaskMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Delete
                      </Button>
                      
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={updateTaskMutation.isPending}
                        >
                          {updateTaskMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Update
                        </Button>
                      </div>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </main>
      </div>
    </div>
  );
}