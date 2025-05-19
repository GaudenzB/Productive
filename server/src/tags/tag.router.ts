import { Router } from 'express';
import { TagController } from './tag.controller';
import { validate } from '../common/validation.middleware';
import { insertTagSchema } from '@shared/schema';
import { z } from 'zod';

// Create a tag router
const tagRouter = Router();
const tagController = new TagController();

// Define validation schemas
const updateTagSchema = insertTagSchema.partial();
const tagIdParamSchema = z.object({
  id: z.string().min(1)
});

// GET /api/tags - Get all tags for the current user
tagRouter.get('/', tagController.getTags);

// GET /api/tags/:id - Get a specific tag
tagRouter.get('/:id', 
  validate(tagIdParamSchema, 'params'),
  tagController.getTag
);

// POST /api/tags - Create a new tag
tagRouter.post('/',
  validate(insertTagSchema),
  tagController.createTag
);

// PATCH /api/tags/:id - Update a tag
tagRouter.patch('/:id',
  validate(tagIdParamSchema, 'params'),
  validate(updateTagSchema),
  tagController.updateTag
);

// DELETE /api/tags/:id - Delete a tag
tagRouter.delete('/:id',
  validate(tagIdParamSchema, 'params'),
  tagController.deleteTag
);

export default tagRouter;