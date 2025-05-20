import { Request, Response, NextFunction } from 'express';
import { TaskService } from './task.service';
import { Task, InsertTask, insertTaskSchema } from '@shared/schema';
import { logger } from '../common/logger';
import { 
  sendSuccess, 
  sendCreated, 
  sendNoContent, 
  sendNotFound 
} from '../common/response';
import { RecordNotFoundError } from '../common/db-errors';

/**
 * Task Controller
 * Handles HTTP requests for task operations
 */
export class TaskController {
  private taskService: TaskService;
  
  constructor() {
    this.taskService = new TaskService();
  }
  
  /**
   * Get all tasks for the current user
   */
  getAllTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const tasks = await this.taskService.getAllForUser(userId);
      
      sendSuccess(res, tasks);
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Get tasks due today
   */
  getTodaysTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const tasks = await this.taskService.getTodaysTasks(userId);
      
      sendSuccess(res, tasks);
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Get overdue tasks
   */
  getOverdueTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const tasks = await this.taskService.getOverdueTasks(userId);
      
      sendSuccess(res, tasks);
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Get tasks for a specific project
   */
  getTasksByProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const projectId = req.params.projectId;
      
      const tasks = await this.taskService.getByProject(projectId, userId);
      
      sendSuccess(res, tasks);
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Get a task by ID
   */
  getTaskById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const taskId = req.params.id;
      
      try {
        const task = await this.taskService.getById(taskId);
        
        // Check that the task belongs to the current user
        if (task.userId !== req.user!.id) {
          return sendNotFound(res);
        }
        
        sendSuccess(res, task);
      } catch (error) {
        if (error instanceof RecordNotFoundError) {
          return sendNotFound(res);
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Create a new task
   */
  createTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      
      // Prepare task data with the current user ID
      const taskData: InsertTask = {
        ...req.body,
        userId,
      };
      
      // Create the task
      const task = await this.taskService.create(taskData);
      
      logger.info(`Task created: ${task.id}`, { 
        userId, 
        taskId: task.id,
        title: task.title 
      });
      
      sendCreated(res, task);
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Update a task
   */
  updateTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const taskId = req.params.id;
      const userId = req.user!.id;
      
      // Check that the task exists and belongs to the user
      try {
        const existingTask = await this.taskService.getById(taskId);
        
        if (existingTask.userId !== userId) {
          return sendNotFound(res);
        }
      } catch (error) {
        if (error instanceof RecordNotFoundError) {
          return sendNotFound(res);
        }
        throw error;
      }
      
      // Update the task
      const updatedTask = await this.taskService.update(taskId, req.body);
      
      logger.info(`Task updated: ${taskId}`, { 
        userId, 
        taskId,
        title: updatedTask.title 
      });
      
      sendSuccess(res, updatedTask);
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Delete a task
   */
  deleteTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const taskId = req.params.id;
      const userId = req.user!.id;
      
      // Check that the task exists and belongs to the user
      try {
        const existingTask = await this.taskService.getById(taskId);
        
        if (existingTask.userId !== userId) {
          return sendNotFound(res);
        }
      } catch (error) {
        if (error instanceof RecordNotFoundError) {
          return sendNotFound(res);
        }
        throw error;
      }
      
      // Delete the task
      await this.taskService.delete(taskId);
      
      logger.info(`Task deleted: ${taskId}`, { userId, taskId });
      
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Mark a task as complete
   */
  completeTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const taskId = req.params.id;
      const userId = req.user!.id;
      
      try {
        const updatedTask = await this.taskService.completeTask(taskId, userId);
        
        logger.info(`Task completed: ${taskId}`, { 
          userId, 
          taskId,
          title: updatedTask.title 
        });
        
        sendSuccess(res, updatedTask);
      } catch (error) {
        if (error instanceof RecordNotFoundError) {
          return sendNotFound(res);
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Mark a task as incomplete
   */
  reopenTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const taskId = req.params.id;
      const userId = req.user!.id;
      
      try {
        const updatedTask = await this.taskService.reopenTask(taskId, userId);
        
        logger.info(`Task reopened: ${taskId}`, { 
          userId, 
          taskId,
          title: updatedTask.title 
        });
        
        sendSuccess(res, updatedTask);
      } catch (error) {
        if (error instanceof RecordNotFoundError) {
          return sendNotFound(res);
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  };
}