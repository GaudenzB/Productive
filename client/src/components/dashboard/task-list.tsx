import React from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { Task } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { Plus, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TaskListProps {
  tasks: Task[];
  isLoading?: boolean;
}

export function TaskList({ tasks, isLoading = false }: TaskListProps) {
  const [, navigate] = useLocation();

  // Sort tasks by status (incomplete first) and then by due date
  const sortedTasks = [...tasks].sort((a, b) => {
    // Incomplete tasks first
    if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return -1;
    if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1;
    
    // Then sort by due date (if available)
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    
    return 0;
  }).slice(0, 4); // Limit to 4 tasks for the dashboard

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Task> }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    }
  });
  
  const handleStatusChange = (taskId: string, completed: boolean) => {
    updateTaskMutation.mutate({
      id: taskId,
      data: { status: completed ? "COMPLETED" : "TODO" },
    });
  };

  return (
    <Card className="bg-white">
      <div className="flex justify-between items-center p-5 pb-0">
        <h2 className="text-lg font-bold">Recent Tasks</h2>
        <Button 
          variant="ghost" 
          className="text-primary text-sm font-medium hover:bg-transparent hover:underline"
          onClick={() => navigate('/tasks')}
        >
          View All
        </Button>
      </div>
      
      <CardContent className="p-5">
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, index) => (
              <div 
                key={`skeleton-${index}`} 
                className="flex items-center p-3 bg-secondary rounded-lg"
              >
                <Skeleton className="h-4 w-4 mr-3 rounded-sm" />
                <div className="ml-1 flex-1">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))
          ) : sortedTasks.length > 0 ? (
            sortedTasks.map((task) => (
              <div 
                key={task.id} 
                className="flex items-center p-3 bg-secondary hover:bg-secondary/80 rounded-lg"
              >
                <Checkbox 
                  checked={task.status === "COMPLETED"}
                  onCheckedChange={(checked) => handleStatusChange(task.id, !!checked)}
                  className="mr-3"
                />
                <div className="ml-1 flex-1">
                  <h3 className={cn(
                    "text-sm font-medium",
                    task.status === "COMPLETED" && "line-through text-muted-foreground"
                  )}>
                    {task.title}
                  </h3>
                  {task.dueDate && (
                    <p className="text-xs text-muted-foreground">
                      Due: {format(new Date(task.dueDate), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
                <PriorityBadge priority={task.priority} />
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No tasks yet
            </div>
          )}
        </div>
        
        <Button 
          className="mt-4 w-full flex items-center justify-center p-2 bg-white border border-border rounded-lg text-primary font-medium hover:bg-secondary/50"
          variant="ghost"
          onClick={() => navigate('/tasks')}
        >
          <Plus className="h-5 w-5 mr-2" />
          Add New Task
        </Button>
      </CardContent>
    </Card>
  );
}
