import { Router } from 'express';
import { ProjectController } from './project.controller';
import { validate } from '../common/validation.middleware';
import { insertProjectSchema } from '@shared/schema';
import { z } from 'zod';

// Create a project router
const projectRouter = Router();
const projectController = new ProjectController();

// Define validation schemas
const updateProjectSchema = insertProjectSchema.partial();
const projectIdParamSchema = z.object({
  id: z.string().min(1)
});

// GET /api/projects - Get all projects for the current user
projectRouter.get('/', projectController.getProjects);

// GET /api/projects/:id - Get a specific project
projectRouter.get('/:id', 
  validate(projectIdParamSchema, 'params'),
  projectController.getProject
);

// POST /api/projects - Create a new project
projectRouter.post('/',
  validate(insertProjectSchema),
  projectController.createProject
);

// PATCH /api/projects/:id - Update a project
projectRouter.patch('/:id',
  validate(projectIdParamSchema, 'params'),
  validate(updateProjectSchema),
  projectController.updateProject
);

// DELETE /api/projects/:id - Delete a project
projectRouter.delete('/:id',
  validate(projectIdParamSchema, 'params'),
  projectController.deleteProject
);

export default projectRouter;