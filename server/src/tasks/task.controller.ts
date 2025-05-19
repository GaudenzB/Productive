import { Request, Response, NextFunction } from 'express';
import { TaskService } from './task.service';
import { UnauthorizedError } from '../common/error.middleware';

export class TaskController {
  private taskService: TaskService;
  
  constructor() {
    this.taskService = new TaskService();
  }
  
  getTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure the user is authenticated
      if (!req.user || !req.isAuthenticated()) {
        return next(new UnauthorizedError());
      }
      
      // Access the id safely through Express.User interface from passport
      const tasks = await this.taskService.getTasks(req.user.id);
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  }
  
  getTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure the user is authenticated
      if (!req.user || !req.isAuthenticated()) {
        return next(new UnauthorizedError());
      }
      
      const task = await this.taskService.getTask(req.params.id);
      
      // Ensure the task belongs to the current user
      if (task.userId !== req.user.id) {
        return next(new UnauthorizedError());
      }
      
      res.json(task);
    } catch (error) {
      next(error);
    }
  }
  
  createTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure the user is authenticated
      if (!req.user || !req.isAuthenticated()) {
        return next(new UnauthorizedError());
      }
      
      // Add the user ID to the task data
      const taskData = {
        ...req.body,
        userId: req.user.id
      };
      
      const task = await this.taskService.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  }
  
  updateTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError());
      }
      
      // First check if the task belongs to the user
      const existingTask = await this.taskService.getTask(req.params.id);
      
      if (existingTask.userId !== req.user.id) {
        return next(new UnauthorizedError());
      }
      
      const updatedTask = await this.taskService.updateTask(req.params.id, req.body);
      res.json(updatedTask);
    } catch (error) {
      next(error);
    }
  }
  
  deleteTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError());
      }
      
      // First check if the task belongs to the user
      const existingTask = await this.taskService.getTask(req.params.id);
      
      if (existingTask.userId !== req.user.id) {
        return next(new UnauthorizedError());
      }
      
      await this.taskService.deleteTask(req.params.id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }
}