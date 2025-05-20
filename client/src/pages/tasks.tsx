import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { TagBadge } from "@/components/ui/tag-badge";
import { TagSelector } from "@/components/ui/tag-selector";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { InsertTask, Task, Project, Tag, TaskTag, InsertTaskTag } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CalendarIcon, Plus, Filter, Search, Tag as TagIcon } from "lucide-react";

// Task form schema
const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  dueDate: z.date().optional().nullable(),
  projectId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional().default([]),
});

export default function Tasks() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Queries
  const { data: tasks, isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });
  
  const { data: projects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  const { data: tags } = useQuery<Tag[]>({
    queryKey: ['/api/tags'],
  });
  
  // Fetch task tags
  const { data: taskTags } = useQuery<TaskTag[]>({
    queryKey: ['/api/task-tags'],
  });
  
  // Helper function to get tags for a task
  const getTaskTags = (taskId: string) => {
    if (!taskTags || !tags) return [];
    const taskTagIds = taskTags
      .filter(tt => tt.taskId === taskId)
      .map(tt => tt.tagId);
    return tags.filter(tag => taskTagIds.includes(tag.id));
  };

  // Filter tasks based on search and filters
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
    
    // Match tag filter
    const matchesTag = !tagFilter || (taskTags && taskTags.some(tt => 
      tt.taskId === task.id && tt.tagId === tagFilter
    ));
    
    return matchesSearch && matchesStatus && matchesPriority && matchesProject && matchesTag;
  }) : [];
  
  // Form
  const form = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: null,
      projectId: null,
      tagIds: [],
    },
  });
  
  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: async (data: InsertTask) => {
      const res = await apiRequest("POST", "/api/tasks", data);
      return res.json();
    },
    onSuccess: (newTask) => {
      // Update the cache with the new task
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      // Additional success handling
      setIsCreateDialogOpen(false);
      form.reset({
        title: "",
        description: "",
        status: "TODO",
        priority: "MEDIUM",
        dueDate: null,
        projectId: null,
      });
      toast({
        title: "Task created",
        description: "Your task has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create task",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Task> }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setSelectedTask(null);
      toast({
        title: "Task updated",
        description: "Your task has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update task",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setSelectedTask(null);
      toast({
        title: "Task deleted",
        description: "Your task has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete task",
        description: error.message,
        variant: "destructive",
      });
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
    // Ensure task status is one of the valid enum values
    const status = (task.status === "TODO" || task.status === "IN_PROGRESS" || task.status === "COMPLETED") 
      ? task.status 
      : "TODO";
    
    // Ensure priority is one of the valid enum values
    const priority = (task.priority === "LOW" || task.priority === "MEDIUM" || task.priority === "HIGH")
      ? task.priority
      : "MEDIUM";
      
    form.reset({
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
  
  const resetForm = () => {
    form.reset({
      title: "",
      description: "",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: null,
      projectId: null,
    });
    setSelectedTask(null);
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
                      }}
                    >
                      Reset Filters
                    </Button>
                    <Button type="button" onClick={() => setIsFilterOpen(false)}>
                      Apply Filters
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
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
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
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
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Describe your task" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
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
                                    <SelectValue placeholder="Select priority" />
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
                        
                        <FormField
                          control={form.control}
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
                                    <SelectValue placeholder="Select status" />
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
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
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
                        
                        <FormField
                          control={form.control}
                          name="projectId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Project</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value || "none"}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Assign to project" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
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
                      </div>
                      
                      <div className="flex justify-end gap-2">
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
                          {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Active Filters Display */}
          {(statusFilter || priorityFilter || projectFilter || searchQuery) && (
            <div className="mb-4 flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              
              {searchQuery && (
                <div className="bg-secondary-foreground/10 text-sm rounded-full px-3 py-1 flex items-center gap-1">
                  <span>Search: {searchQuery}</span>
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="ml-1 hover:text-destructive"
                    aria-label="Clear search filter"
                  >
                    ×
                  </button>
                </div>
              )}
              
              {statusFilter && (
                <div className="bg-secondary-foreground/10 text-sm rounded-full px-3 py-1 flex items-center gap-1">
                  <span>Status: {statusFilter}</span>
                  <button 
                    onClick={() => setStatusFilter(null)}
                    className="ml-1 hover:text-destructive"
                    aria-label="Clear status filter"
                  >
                    ×
                  </button>
                </div>
              )}
              
              {priorityFilter && (
                <div className="bg-secondary-foreground/10 text-sm rounded-full px-3 py-1 flex items-center gap-1">
                  <span>Priority: {priorityFilter}</span>
                  <button 
                    onClick={() => setPriorityFilter(null)}
                    className="ml-1 hover:text-destructive"
                    aria-label="Clear priority filter"
                  >
                    ×
                  </button>
                </div>
              )}
              
              {projectFilter && projects && (
                <div className="bg-secondary-foreground/10 text-sm rounded-full px-3 py-1 flex items-center gap-1">
                  <span>Project: {projects.find(p => p.id === projectFilter)?.title}</span>
                  <button 
                    onClick={() => setProjectFilter(null)}
                    className="ml-1 hover:text-destructive"
                    aria-label="Clear project filter"
                  >
                    ×
                  </button>
                </div>
              )}
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter(null);
                  setPriorityFilter(null);
                  setProjectFilter(null);
                }}
              >
                Clear all
              </Button>
            </div>
          )}
          
          {/* Task List */}
          <div className="grid grid-cols-1 gap-4">
            {isLoadingTasks ? (
              // Loading state
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading tasks...</p>
              </div>
            ) : !tasks || tasks.length === 0 ? (
              // Empty state - no tasks at all
              <div className="text-center py-10">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No tasks yet</h3>
                <p className="text-muted-foreground mt-2">
                  Create your first task to get started
                </p>
                <Button
                  className="mt-4"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  Create Task
                </Button>
              </div>
            ) : filteredTasks.length === 0 ? (
              // No tasks match the filters
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Filter className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No matching tasks</h3>
                <p className="text-muted-foreground mt-2">
                  Try adjusting your filters or search query
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter(null);
                    setPriorityFilter(null);
                    setProjectFilter(null);
                  }}
                >
                  Clear all filters
                </Button>
              </div>
            ) : (
              // Show filtered tasks
              filteredTasks.map(task => (
                <Card 
                  key={task.id} 
                  className={cn(
                    "hover:shadow-md transition-shadow", 
                    task.status === "COMPLETED" && "opacity-70"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        checked={task.status === "COMPLETED"} 
                        onCheckedChange={(checked) => onStatusChange(task.id, !!checked)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className={cn(
                              "font-medium text-base",
                              task.status === "COMPLETED" && "line-through text-muted-foreground"
                            )}>
                              {task.title}
                            </h3>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                            )}
                          </div>
                          <PriorityBadge priority={task.priority} />
                        </div>
                        
                        <div className="flex justify-between items-center mt-3">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {task.dueDate && (
                              <span>Due: {format(new Date(task.dueDate), "MMM d, yyyy")}</span>
                            )}
                            {task.projectId && projects && (
                              <span>
                                Project: {projects.find(p => p.id === task.projectId)?.title}
                              </span>
                            )}
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => onTaskSelect(task)}
                              >
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Task</DialogTitle>
                              </DialogHeader>
                              <Form {...form}>
                                <form onSubmit={form.handleSubmit(onUpdateSubmit)} className="space-y-4">
                                  <FormField
                                    control={form.control}
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
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                          <Textarea placeholder="Describe your task" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                      control={form.control}
                                      name="priority"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Priority</FormLabel>
                                          <Select 
                                            onValueChange={field.onChange} 
                                            value={field.value}
                                          >
                                            <FormControl>
                                              <SelectTrigger>
                                                <SelectValue placeholder="Select priority" />
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
                                    
                                    <FormField
                                      control={form.control}
                                      name="status"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Status</FormLabel>
                                          <Select 
                                            onValueChange={field.onChange} 
                                            value={field.value}
                                          >
                                            <FormControl>
                                              <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
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
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                      control={form.control}
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
                                    
                                    <FormField
                                      control={form.control}
                                      name="projectId"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Project</FormLabel>
                                          <Select
                                            onValueChange={field.onChange}
                                            value={field.value || "none"}
                                          >
                                            <FormControl>
                                              <SelectTrigger>
                                                <SelectValue placeholder="Assign to project" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                              <SelectItem value="none">None</SelectItem>
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
                                  </div>
                                  
                                  <div className="flex justify-between">
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      onClick={() => deleteTaskMutation.mutate(selectedTask!.id)}
                                      disabled={deleteTaskMutation.isPending}
                                    >
                                      {deleteTaskMutation.isPending ? "Deleting..." : "Delete"}
                                    </Button>
                                    
                                    <div className="flex gap-2">
                                      <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={resetForm}
                                      >
                                        Cancel
                                      </Button>
                                      <Button 
                                        type="submit" 
                                        disabled={updateTaskMutation.isPending}
                                      >
                                        {updateTaskMutation.isPending ? "Saving..." : "Save Changes"}
                                      </Button>
                                    </div>
                                  </div>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              // Empty state
              <Card className="text-center py-10">
                <CardContent>
                  <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first task to get started</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New Task
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
