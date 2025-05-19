import { Request, Response, NextFunction } from 'express';
import { ProjectService } from './project.service';
import { UnauthorizedError } from '../common/error.middleware';

export class ProjectController {
  private projectService: ProjectService;
  
  constructor() {
    this.projectService = new ProjectService();
  }
  
  getProjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure the user is authenticated
      if (!req.user || !req.isAuthenticated()) {
        return next(new UnauthorizedError());
      }
      
      const projects = await this.projectService.getProjects(req.user.id);
      res.json(projects);
    } catch (error) {
      next(error);
    }
  }
  
  getProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure the user is authenticated
      if (!req.user || !req.isAuthenticated()) {
        return next(new UnauthorizedError());
      }
      
      const project = await this.projectService.getProject(req.params.id);
      
      // Ensure the project belongs to the current user
      if (project.userId !== req.user.id) {
        return next(new UnauthorizedError());
      }
      
      res.json(project);
    } catch (error) {
      next(error);
    }
  }
  
  createProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure the user is authenticated
      if (!req.user || !req.isAuthenticated()) {
        return next(new UnauthorizedError());
      }
      
      // Add the user ID to the project data
      const projectData = {
        ...req.body,
        userId: req.user.id
      };
      
      const project = await this.projectService.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  }
  
  updateProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure the user is authenticated
      if (!req.user || !req.isAuthenticated()) {
        return next(new UnauthorizedError());
      }
      
      // First check if the project belongs to the user
      const existingProject = await this.projectService.getProject(req.params.id);
      
      if (existingProject.userId !== req.user.id) {
        return next(new UnauthorizedError());
      }
      
      const updatedProject = await this.projectService.updateProject(req.params.id, req.body);
      res.json(updatedProject);
    } catch (error) {
      next(error);
    }
  }
  
  deleteProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure the user is authenticated
      if (!req.user || !req.isAuthenticated()) {
        return next(new UnauthorizedError());
      }
      
      // First check if the project belongs to the user
      const existingProject = await this.projectService.getProject(req.params.id);
      
      if (existingProject.userId !== req.user.id) {
        return next(new UnauthorizedError());
      }
      
      await this.projectService.deleteProject(req.params.id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }
}