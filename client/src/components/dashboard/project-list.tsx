import React from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Project, Task } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

interface ProjectListProps {
  projects: Project[];
  isLoading?: boolean;
}

export function ProjectList({ projects, isLoading = false }: ProjectListProps) {
  const [, navigate] = useLocation();

  const { data: tasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  // Sort projects by status (active first)
  const activeProjects = projects
    .filter(project => project.status === "ACTIVE")
    .slice(0, 3); // Limit to 3 projects for the dashboard

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

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold">Active Projects</h2>
        <Button 
          variant="ghost" 
          className="text-primary text-sm font-medium hover:bg-transparent hover:underline"
          onClick={() => navigate('/projects')}
        >
          View All
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, index) => (
            <Card 
              key={`skeleton-${index}`} 
              className="bg-white"
            >
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-2 w-full rounded-full mb-2" />
                <div className="flex justify-between text-xs">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : activeProjects.length > 0 ? (
          activeProjects.map((project) => (
            <Card 
              key={project.id} 
              className="hover:shadow-md transition-shadow bg-white"
            >
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium">{project.title}</h3>
                  <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">ACTIVE</span>
                </div>
                {project.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.description}</p>
                )}
                <div className="h-2 w-full bg-secondary rounded-full mb-2">
                  <div 
                    className="h-2 bg-primary rounded-full" 
                    style={{ width: `${getProjectProgress(project.id)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{getProjectProgress(project.id)}% Complete</span>
                  <span className="text-muted-foreground">{getTaskCount(project.id)} Tasks</span>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-1 md:col-span-2 lg:col-span-3 bg-white">
            <CardContent className="flex flex-col items-center justify-center py-6">
              <p className="text-muted-foreground mb-4">No active projects</p>
              <Button 
                onClick={() => navigate('/projects')}
                className="text-primary bg-white border border-border hover:bg-secondary/50"
              >
                Create a project
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
