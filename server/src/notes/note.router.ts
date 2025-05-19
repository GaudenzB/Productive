import { Router } from 'express';
import { NoteController } from './note.controller';
import { validate } from '../common/validation.middleware';
import { insertNoteSchema } from '@shared/schema';
import { z } from 'zod';

// Create a note router
const noteRouter = Router();
const noteController = new NoteController();

// Define validation schemas
const updateNoteSchema = insertNoteSchema.partial();
const noteIdParamSchema = z.object({
  id: z.string().min(1)
});

// GET /api/notes - Get all notes for the current user
noteRouter.get('/', noteController.getNotes);

// GET /api/notes/:id - Get a specific note
noteRouter.get('/:id', 
  validate(noteIdParamSchema, 'params'),
  noteController.getNote
);

// POST /api/notes - Create a new note
noteRouter.post('/',
  validate(insertNoteSchema),
  noteController.createNote
);

// PATCH /api/notes/:id - Update a note
noteRouter.patch('/:id',
  validate(noteIdParamSchema, 'params'),
  validate(updateNoteSchema),
  noteController.updateNote
);

// DELETE /api/notes/:id - Delete a note
noteRouter.delete('/:id',
  validate(noteIdParamSchema, 'params'),
  noteController.deleteNote
);

export default noteRouter;