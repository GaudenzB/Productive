import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { InsertProject, Project, Task } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Filter, Search, CheckCircle, CircleSlash, Layers } from "lucide-react";

// Project form schema
const projectFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "ARCHIVED"]),
});

export default function Projects() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { toast } = useToast();
  
  // Queries
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  const { data: tasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });
  
  // Form
  const form = useForm<z.infer<typeof projectFormSchema>>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "ACTIVE",
    },
  });
  
  // Mutations
  const createProjectMutation = useMutation({
    mutationFn: async (data: InsertProject) => {
      const res = await apiRequest("POST", "/api/projects", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Project created",
        description: "Your project has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create project",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Project> }) => {
      const res = await apiRequest("PATCH", `/api/projects/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setSelectedProject(null);
      toast({
        title: "Project updated",
        description: "Your project has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update project",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setSelectedProject(null);
      toast({
        title: "Project deleted",
        description: "Your project has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete project",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handlers
  const onCreateSubmit = (data: z.infer<typeof projectFormSchema>) => {
    createProjectMutation.mutate(data as InsertProject);
  };
  
  const onUpdateSubmit = (data: z.infer<typeof projectFormSchema>) => {
    if (selectedProject) {
      updateProjectMutation.mutate({ id: selectedProject.id, data });
    }
  };
  
  const onProjectSelect = (project: Project) => {
    setSelectedProject(project);
    form.reset({
      title: project.title,
      description: project.description || "",
      status: project.status,
    });
  };
  
  const resetForm = () => {
    form.reset({
      title: "",
      description: "",
      status: "ACTIVE",
    });
    setSelectedProject(null);
  };
  
  // Calculate project progress
  const getProjectProgress = (projectId: string) => {
    if (!tasks) return 0;
    
    const projectTasks = tasks.filter(task => task.projectId === projectId);
    if (projectTasks.length === 0) return 0;
    
    const completedTasks = projectTasks.filter(task => task.status === "COMPLETED").length;
    return Math.round((completedTasks / projectTasks.length) * 100);
  };
  
  const getTaskCount = (projectId: string) => {
    if (!tasks) return 0;
    return tasks.filter(task => task.projectId === projectId).length;
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <span className="w-2.5 h-2.5 bg-primary rounded-full" />;
      case "COMPLETED":
        return <span className="w-2.5 h-2.5 bg-success rounded-full" />;
      case "ARCHIVED":
        return <span className="w-2.5 h-2.5 bg-muted-foreground rounded-full" />;
      default:
        return null;
    }
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen overflow-hidden">
        <Header onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-secondary">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-2xl font-bold">Projects</h1>
            
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto mt-4 md:mt-0">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search projects..." className="pl-8" />
              </div>
              
              <Button variant="outline" className="gap-1">
                <Filter className="h-4 w-4" /> Filter
              </Button>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-1">
                    <Plus className="h-4 w-4" /> New Project
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
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
                              <Input placeholder="Project title" {...field} />
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
                              <Textarea placeholder="Describe your project" {...field} />
                            </FormControl>
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
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="ARCHIVED">Archived</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
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
                          disabled={createProjectMutation.isPending}
                        >
                          {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Project Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingProjects ? (
              // Loading state
              <div className="text-center py-10 col-span-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading projects...</p>
              </div>
            ) : projects && projects.length > 0 ? (
              // Project cards
              projects.map((project) => (
                <Card 
                  key={project.id} 
                  className={cn(
                    "hover:shadow-md transition-shadow",
                    project.status === "ARCHIVED" && "opacity-60"
                  )}
                >
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-medium text-base">{project.title}</h3>
                      <div className={cn(
                        "text-xs px-2 py-1 rounded-full flex items-center gap-1 font-medium",
                        project.status === "ACTIVE" && "bg-primary/10 text-primary",
                        project.status === "COMPLETED" && "bg-success/10 text-success",
                        project.status === "ARCHIVED" && "bg-muted text-muted-foreground"
                      )}>
                        {getStatusIcon(project.status)}
                        {project.status}
                      </div>
                    </div>
                    
                    {project.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    
                    <div className="h-2 w-full bg-secondary rounded-full mb-2">
                      <div 
                        className={cn(
                          "h-2 rounded-full",
                          project.status === "COMPLETED" ? "bg-success" : "bg-primary"
                        )}
                        style={{ width: `${getProjectProgress(project.id)}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {getProjectProgress(project.id)}% Complete
                      </span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {getTaskCount(project.id)} Tasks
                      </span>
                    </div>
                    
                    <div className="flex mt-4 justify-end">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onProjectSelect(project)}
                          >
                            Manage
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Manage Project</DialogTitle>
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
                                      <Input placeholder="Project title" {...field} />
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
                                      <Textarea placeholder="Describe your project" {...field} />
                                    </FormControl>
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
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="COMPLETED">Completed</SelectItem>
                                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <div className="mt-2">
                                <h4 className="text-sm font-medium mb-2">Project Progress</h4>
                                <div className="h-2 w-full bg-secondary rounded-full mb-2">
                                  <div 
                                    className={cn(
                                      "h-2 rounded-full",
                                      selectedProject?.status === "COMPLETED" ? "bg-success" : "bg-primary"
                                    )}
                                    style={{ width: `${selectedProject ? getProjectProgress(selectedProject.id) : 0}%` }}
                                  ></div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {selectedProject && getTaskCount(selectedProject.id) > 0 ? (
                                    <span>{getProjectProgress(selectedProject.id)}% complete ({getTaskCount(selectedProject.id)} tasks)</span>
                                  ) : (
                                    <span>No tasks assigned to this project</span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex justify-between">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  onClick={() => deleteProjectMutation.mutate(selectedProject!.id)}
                                  disabled={deleteProjectMutation.isPending}
                                >
                                  {deleteProjectMutation.isPending ? "Deleting..." : "Delete"}
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
                                    disabled={updateProjectMutation.isPending}
                                  >
                                    {updateProjectMutation.isPending ? "Saving..." : "Save Changes"}
                                  </Button>
                                </div>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              // Empty state
              <div className="col-span-3">
                <Card className="text-center py-10">
                  <CardContent>
                    <h3 className="text-lg font-medium mb-2">No projects yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first project to organize your tasks</p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" /> New Project
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
