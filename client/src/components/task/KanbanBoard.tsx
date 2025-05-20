import React, { useState } from 'react';
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
      const updatedTask = {...task, status: newStatus};
      
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

  // Get task by id
  const getTask = (id: string) => tasks.find(t => t.id === id);

  return (
    <div className="mt-6">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.values(columns).map(column => (
            <div key={column.id} className="flex flex-col">
              <div className="bg-card rounded-t-md p-3 border border-b-0 shadow-sm">
                <h3 className="font-medium text-sm flex items-center">
                  {column.title} 
                  <span className="ml-2 text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
                    {column.taskIds.length}
                  </span>
                </h3>
              </div>
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex-1 min-h-[200px] p-2 border rounded-b-md space-y-2 transition-colors",
                      snapshot.isDraggingOver ? "bg-secondary" : "bg-card/50"
                    )}
                  >
                    {column.taskIds.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-muted-foreground">No tasks</p>
                      </div>
                    ) : (
                      column.taskIds.map((taskId, index) => {
                        const task = getTask(taskId);
                        if (!task) return null;
                        
                        return (
                          <Draggable key={taskId} draggableId={taskId} index={index}>
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  "mb-2 hover:shadow-md transition-shadow",
                                  snapshot.isDragging && "shadow-lg",
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
                                        <div>
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
                                      
                                      <div className="flex flex-col gap-1 mt-2">
                                        <div className="flex flex-wrap gap-1">
                                          {getTaskTags(task.id).map(tag => (
                                            <TagBadge 
                                              key={tag.id} 
                                              name={tag.name} 
                                              color={tag.color} 
                                              className="text-[10px] px-1.5 py-0"
                                            />
                                          ))}
                                        </div>
                                        
                                        <div className="flex justify-between items-center mt-1">
                                          <div className="flex items-center text-xs text-muted-foreground">
                                            {task.dueDate && (
                                              <span className="text-[10px]">
                                                {format(new Date(task.dueDate), "MMM d")}
                                              </span>
                                            )}
                                          </div>
                                          <Button 
                                            variant="ghost" 
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => onTaskSelect(task)}
                                          >
                                            <PenLine className="h-3 w-3" />
                                          </Button>
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