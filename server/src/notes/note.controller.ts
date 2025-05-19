import { Request, Response, NextFunction } from 'express';
import { NoteService } from './note.service';
import { UnauthorizedError } from '../common/error.middleware';

export class NoteController {
  private noteService: NoteService;
  
  constructor() {
    this.noteService = new NoteService();
  }
  
  getNotes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure the user is authenticated
      if (!req.user || !req.isAuthenticated()) {
        return next(new UnauthorizedError());
      }
      
      const notes = await this.noteService.getNotes(req.user.id);
      res.json(notes);
    } catch (error) {
      next(error);
    }
  }
  
  getNote = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure the user is authenticated
      if (!req.user || !req.isAuthenticated()) {
        return next(new UnauthorizedError());
      }
      
      const note = await this.noteService.getNote(req.params.id);
      
      // Ensure the note belongs to the current user
      if (note.userId !== req.user.id) {
        return next(new UnauthorizedError());
      }
      
      res.json(note);
    } catch (error) {
      next(error);
    }
  }
  
  createNote = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure the user is authenticated
      if (!req.user || !req.isAuthenticated()) {
        return next(new UnauthorizedError());
      }
      
      // Add the user ID to the note data
      const noteData = {
        ...req.body,
        userId: req.user.id
      };
      
      const note = await this.noteService.createNote(noteData);
      res.status(201).json(note);
    } catch (error) {
      next(error);
    }
  }
  
  updateNote = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure the user is authenticated
      if (!req.user || !req.isAuthenticated()) {
        return next(new UnauthorizedError());
      }
      
      // First check if the note belongs to the user
      const existingNote = await this.noteService.getNote(req.params.id);
      
      if (existingNote.userId !== req.user.id) {
        return next(new UnauthorizedError());
      }
      
      const updatedNote = await this.noteService.updateNote(req.params.id, req.body);
      res.json(updatedNote);
    } catch (error) {
      next(error);
    }
  }
  
  deleteNote = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure the user is authenticated
      if (!req.user || !req.isAuthenticated()) {
        return next(new UnauthorizedError());
      }
      
      // First check if the note belongs to the user
      const existingNote = await this.noteService.getNote(req.params.id);
      
      if (existingNote.userId !== req.user.id) {
        return next(new UnauthorizedError());
      }
      
      await this.noteService.deleteNote(req.params.id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }
}