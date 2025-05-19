import { Request, Response, NextFunction } from 'express';
import { TagService } from './tag.service';
import { UnauthorizedError } from '../common/error.middleware';

export class TagController {
  private tagService: TagService;
  
  constructor() {
    this.tagService = new TagService();
  }
  
  getTags = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure the user is authenticated
      if (!req.user || !req.isAuthenticated()) {
        return next(new UnauthorizedError());
      }
      
      const tags = await this.tagService.getTags(req.user.id);
      res.json(tags);
    } catch (error) {
      next(error);
    }
  }
  
  getTag = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure the user is authenticated
      if (!req.user || !req.isAuthenticated()) {
        return next(new UnauthorizedError());
      }
      
      const tag = await this.tagService.getTag(req.params.id);
      
      // Ensure the tag belongs to the current user
      if (tag.userId !== req.user.id) {
        return next(new UnauthorizedError());
      }
      
      res.json(tag);
    } catch (error) {
      next(error);
    }
  }
  
  createTag = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure the user is authenticated
      if (!req.user || !req.isAuthenticated()) {
        return next(new UnauthorizedError());
      }
      
      // Add the user ID to the tag data
      const tagData = {
        ...req.body,
        userId: req.user.id
      };
      
      const tag = await this.tagService.createTag(tagData);
      res.status(201).json(tag);
    } catch (error) {
      next(error);
    }
  }
  
  updateTag = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure the user is authenticated
      if (!req.user || !req.isAuthenticated()) {
        return next(new UnauthorizedError());
      }
      
      // First check if the tag belongs to the user
      const existingTag = await this.tagService.getTag(req.params.id);
      
      if (existingTag.userId !== req.user.id) {
        return next(new UnauthorizedError());
      }
      
      const updatedTag = await this.tagService.updateTag(req.params.id, req.body);
      res.json(updatedTag);
    } catch (error) {
      next(error);
    }
  }
  
  deleteTag = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure the user is authenticated
      if (!req.user || !req.isAuthenticated()) {
        return next(new UnauthorizedError());
      }
      
      // First check if the tag belongs to the user
      const existingTag = await this.tagService.getTag(req.params.id);
      
      if (existingTag.userId !== req.user.id) {
        return next(new UnauthorizedError());
      }
      
      await this.tagService.deleteTag(req.params.id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }
}