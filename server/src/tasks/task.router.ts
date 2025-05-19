import { Router } from 'express';
import { TaskController } from './task.controller';
import { validate } from '../common/validation.middleware';
import { insertTaskSchema } from '@shared/schema';
import { z } from 'zod';

// Create a task router
const taskRouter = Router();
const taskController = new TaskController();

// Define validation schemas
const updateTaskSchema = insertTaskSchema.partial();
const taskIdParamSchema = z.object({
  id: z.string().min(1)
});

// GET /api/tasks - Get all tasks for the current user
taskRouter.get('/', taskController.getTasks);

// GET /api/tasks/:id - Get a specific task
taskRouter.get('/:id', 
  validate(taskIdParamSchema, 'params'),
  taskController.getTask
);

// POST /api/tasks - Create a new task
taskRouter.post('/',
  validate(insertTaskSchema),
  taskController.createTask
);

// PATCH /api/tasks/:id - Update a task
taskRouter.patch('/:id',
  validate(taskIdParamSchema, 'params'),
  validate(updateTaskSchema),
  taskController.updateTask
);

// DELETE /api/tasks/:id - Delete a task
taskRouter.delete('/:id',
  validate(taskIdParamSchema, 'params'),
  taskController.deleteTask
);

export default taskRouter;