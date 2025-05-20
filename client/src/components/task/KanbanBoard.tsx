import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Task, Tag, TaskTag, Project } from '@shared/schema';
import { Checkbox } from '@/components/ui/checkbox';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { TagBadge } from '@/components/ui/tag-badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { PenLine } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  projects?: Project[];
  tags?: Tag[];
  taskTags?: TaskTag[];
  onTaskStatusChange: (taskId: string, newStatus: string) => void;
  onTaskSelect: (task: Task) => void;
  getTaskTags: (taskId: string) => Tag[];
}

type KanbanColumn = {
  id: string;
  title: string;
  taskIds: string[];
};

export function KanbanBoard({
  tasks,
  projects,
  tags,
  taskTags,
  onTaskStatusChange,
  onTaskSelect,
  getTaskTags
}: KanbanBoardProps) {
  // Helper function to get task by id
  const getTask = (id: string) => tasks.find(t => t.id === id);

  // Function to check if task is due today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // Function to check if task is due this week
  const isThisWeek = (date: Date) => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return date >= weekStart && date <= weekEnd;
  };
  
  // Group tasks by status
  const columns: Record<string, KanbanColumn> = {
    'TODO': { id: 'TODO', title: 'To Do', taskIds: [] },
    'IN_PROGRESS': { id: 'IN_PROGRESS', title: 'In Progress', taskIds: [] },
    'COMPLETED': { id: 'COMPLETED', title: 'Completed', taskIds: [] }
  };

  // Add tasks to appropriate columns
  tasks.forEach(task => {
    const status = task.status;
    if (columns[status]) {
      columns[status].taskIds.push(task.id);
    } else {
      // If status doesn't match any column, default to TODO
      columns['TODO'].taskIds.push(task.id);
    }
  });
  
  // Sort tasks in columns by priority and due date
  Object.values(columns).forEach(column => {
    column.taskIds.sort((a, b) => {
      const taskA = getTask(a);
      const taskB = getTask(b);
      
      if (!taskA || !taskB) return 0;
      
      // First sort by priority
      const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      const priorityA = priorityOrder[taskA.priority as keyof typeof priorityOrder] || 1;
      const priorityB = priorityOrder[taskB.priority as keyof typeof priorityOrder] || 1;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Then sort by due date (if available)
      if (taskA.dueDate && taskB.dueDate) {
        return new Date(taskA.dueDate).getTime() - new Date(taskB.dueDate).getTime();
      }
      
      // Tasks with due dates come before tasks without due dates
      if (taskA.dueDate && !taskB.dueDate) return -1;
      if (!taskA.dueDate && taskB.dueDate) return 1;
      
      return 0;
    });
  });

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If there's no destination or the item was dropped in its original position
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    // Get the task that was moved
    const taskId = draggableId;
    
    // Determine the new status based on the destination column
    const newStatus = destination.droppableId;

    // Log the task move for debugging
    console.log(`Moving task ${taskId} from ${source.droppableId} to ${newStatus}`);

    // Update task status in the parent component
    onTaskStatusChange(taskId, newStatus);
    
    // Immediately update the UI to reflect the change
    // This creates a more responsive experience even if the server call is still processing
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      // Find task by ID and update its status (optimistic update)
      const sourceColumn = columns[source.droppableId];
      const destinationColumn = columns[destination.droppableId];
      
      if (sourceColumn && destinationColumn) {
        // Remove from source column
        sourceColumn.taskIds = sourceColumn.taskIds.filter(id => id !== taskId);
        
        // Add to destination column
        destinationColumn.taskIds.push(taskId);
      }
    }
  };

  return (
    <div className="mt-6">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.values(columns).map(column => (
            <div key={column.id} className="flex flex-col">
              <div className={cn(
                "rounded-t-md p-3 border border-b-0 shadow-sm",
                column.id === "TODO" && "bg-blue-50 dark:bg-blue-950",
                column.id === "IN_PROGRESS" && "bg-amber-50 dark:bg-amber-950",
                column.id === "COMPLETED" && "bg-green-50 dark:bg-green-950",
              )}>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {column.id === "TODO" && (
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                      )}
                      {column.id === "IN_PROGRESS" && (
                        <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-2"></span>
                      )}
                      {column.id === "COMPLETED" && (
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                      )}
                      <h3 className="font-medium text-sm">{column.title}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 rounded-full hover:bg-secondary/80"
                        onClick={() => {
                          // This is a placeholder for sorting functionality
                        }}
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          className="h-3 w-3"
                        >
                          <path d="M3 6h18"></path>
                          <path d="M7 12h10"></path>
                          <path d="M10 18h4"></path>
                        </svg>
                      </Button>
                      <span className="text-xs font-semibold bg-secondary px-2 py-1 rounded-full">
                        {column.taskIds.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex-1 min-h-[300px] p-3 border rounded-b-md space-y-3 transition-all",
                      column.id === "TODO" && "border-blue-200 dark:border-blue-800",
                      column.id === "IN_PROGRESS" && "border-amber-200 dark:border-amber-800",
                      column.id === "COMPLETED" && "border-green-200 dark:border-green-800",
                      snapshot.isDraggingOver && column.id === "TODO" && "bg-blue-50/70 dark:bg-blue-900/30",
                      snapshot.isDraggingOver && column.id === "IN_PROGRESS" && "bg-amber-50/70 dark:bg-amber-900/30",
                      snapshot.isDraggingOver && column.id === "COMPLETED" && "bg-green-50/70 dark:bg-green-900/30",
                      !snapshot.isDraggingOver && "bg-card/50"
                    )}
                  >
                    {column.taskIds.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <div className={cn(
                          "w-12 h-12 rounded-full mb-3 flex items-center justify-center",
                          column.id === "TODO" && "bg-blue-100 dark:bg-blue-900/30",
                          column.id === "IN_PROGRESS" && "bg-amber-100 dark:bg-amber-900/30",
                          column.id === "COMPLETED" && "bg-green-100 dark:bg-green-900/30"
                        )}>
                          {column.id === "TODO" && <span className="text-2xl">📋</span>}
                          {column.id === "IN_PROGRESS" && <span className="text-2xl">⚙️</span>}
                          {column.id === "COMPLETED" && <span className="text-2xl">✅</span>}
                        </div>
                        <p className="text-sm font-medium mb-1">No {column.title} Tasks</p>
                        <p className="text-xs text-muted-foreground max-w-[200px]">
                          {column.id === "TODO" && "Drag tasks here or create new tasks to get started"}
                          {column.id === "IN_PROGRESS" && "Move tasks here when you start working on them"}
                          {column.id === "COMPLETED" && "Complete tasks will appear here"}
                        </p>
                      </div>
                    ) : (
                      column.taskIds.map((taskId, index) => {
                        const task = getTask(taskId);
                        if (!task) return null;
                        
                        // Calculate if task is overdue
                        const isOverdue = task.dueDate && 
                                         new Date(task.dueDate) < new Date() && 
                                         task.status !== "COMPLETED";
                        
                        return (
                          <Draggable key={taskId} draggableId={taskId} index={index}>
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  "mb-2 hover:shadow-md hover:translate-y-[-2px] transition-all border-l-4 cursor-grab",
                                  task.priority === "HIGH" && "border-l-red-400",
                                  task.priority === "MEDIUM" && "border-l-amber-400",
                                  task.priority === "LOW" && "border-l-green-400",
                                  isOverdue && "border-red-500 dark:border-red-700",
                                  snapshot.isDragging && "shadow-lg scale-[1.02] cursor-grabbing border-2 border-primary/30",
                                  task.status === "COMPLETED" && "opacity-70"
                                )}
                              >
                                <CardContent className="p-3">
                                  <div className="flex items-start gap-2">
                                    <Checkbox 
                                      checked={task.status === "COMPLETED"} 
                                      onCheckedChange={(checked) => 
                                        onTaskStatusChange(task.id, checked ? "COMPLETED" : "TODO")
                                      }
                                      className="mt-1"
                                    />
                                    <div className="flex-1">
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1 pr-2">
                                          <h3 className={cn(
                                            "font-medium text-sm",
                                            task.status === "COMPLETED" && "line-through text-muted-foreground"
                                          )}>
                                            {task.title}
                                          </h3>
                                          {task.description && (
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                              {task.description}
                                            </p>
                                          )}
                                        </div>
                                        <PriorityBadge priority={task.priority} size="small" />
                                      </div>
                                      
                                      {/* Project indicator if available */}
                                      {task.projectId && projects && (
                                        <div className="mt-2">
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-secondary">
                                            {projects.find(p => p.id === task.projectId)?.title || 'Project'}
                                          </span>
                                        </div>
                                      )}
                                      
                                      <div className="flex flex-col gap-1 mt-2">
                                        {/* Tags section with hover effects */}
                                        <div className="flex flex-wrap gap-1">
                                          {getTaskTags(task.id).map(tag => (
                                            <TagBadge 
                                              key={tag.id} 
                                              name={tag.name} 
                                              color={tag.color} 
                                              className="text-[10px] px-1.5 py-0 hover:opacity-80 transition-opacity"
                                            />
                                          ))}
                                        </div>
                                        
                                        <div className="flex justify-between items-center mt-2 pt-1 border-t border-border/50">
                                          <div className="flex items-center text-xs">
                                            {task.dueDate && (
                                              <span className={cn(
                                                "text-[10px] px-1.5 py-0.5 rounded",
                                                isOverdue
                                                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
                                                  : "text-muted-foreground"
                                              )}>
                                                {format(new Date(task.dueDate), "MMM d")}
                                              </span>
                                            )}
                                          </div>
                                          
                                          <div className="flex gap-1">
                                            <Button 
                                              variant="ghost" 
                                              size="icon"
                                              className="h-6 w-6 hover:bg-secondary"
                                              onClick={() => onTaskSelect(task)}
                                            >
                                              <PenLine className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        );
                      })
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}