import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { setupApiDocumentation, setupApiVersioning } from "./api";
import {
  insertTaskSchema,
  insertProjectSchema,
  insertMeetingSchema,
  insertNoteSchema,
  insertTagSchema
} from "@shared/schema";
import { BadRequestError, NotFoundError, UnauthorizedError, ConflictError } from "./errors";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up API documentation and versioning
  setupApiDocumentation(app);
  setupApiVersioning(app);
  
  // Set up authentication routes
  setupAuth(app);
  
  // Global error handling middleware to be used at the end
  const errorHandler = (err: any, req: any, res: any, next: any) => {
    console.error(`[ERROR] ${err.message}`);
    
    // Generate a unique request ID for tracking
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Get status code from error or default to 500
    const status = err.status || 500;
    
    // Format the error response
    const errorResponse = {
      status: 'error',
      message: err.message || 'An unexpected error occurred',
      code: err.code || 'INTERNAL_SERVER_ERROR',
      path: req.path,
      timestamp: new Date().toISOString(),
      requestId,
    };
    
    // Add validation errors if present
    if (err.errors) {
      Object.assign(errorResponse, { errors: err.errors });
    }
    
    res.status(status).json(errorResponse);
  };

  // Tasks Routes
  app.get("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const tasks = await storage.getTasks(req.user.id);
    res.json(tasks);
  });

  app.post("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const data = insertTaskSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const task = await storage.createTask(data);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "An error occurred while creating task" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const taskId = req.params.id;
    const task = await storage.getTask(taskId);
    
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    if (task.userId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const updatedTask = await storage.updateTask(taskId, req.body);
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: "An error occurred while updating task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const taskId = req.params.id;
    const task = await storage.getTask(taskId);
    
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    if (task.userId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      await storage.deleteTask(taskId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "An error occurred while deleting task" });
    }
  });

  // Projects Routes
  app.get("/api/projects", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const projects = await storage.getProjects(req.user.id);
    res.json(projects);
  });

  app.post("/api/projects", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const data = insertProjectSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const project = await storage.createProject(data);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "An error occurred while creating project" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const projectId = req.params.id;
    const project = await storage.getProject(projectId);
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    if (project.userId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const updatedProject = await storage.updateProject(projectId, req.body);
      res.json(updatedProject);
    } catch (error) {
      res.status(500).json({ message: "An error occurred while updating project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const projectId = req.params.id;
    const project = await storage.getProject(projectId);
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    if (project.userId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      await storage.deleteProject(projectId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "An error occurred while deleting project" });
    }
  });

  // Meetings Routes
  app.get("/api/meetings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const meetings = await storage.getMeetings(req.user.id);
    res.json(meetings);
  });

  app.post("/api/meetings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const data = insertMeetingSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const meeting = await storage.createMeeting(data);
      res.status(201).json(meeting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "An error occurred while creating meeting" });
    }
  });

  app.patch("/api/meetings/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const meetingId = req.params.id;
    const meeting = await storage.getMeeting(meetingId);
    
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }
    
    if (meeting.userId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const updatedMeeting = await storage.updateMeeting(meetingId, req.body);
      res.json(updatedMeeting);
    } catch (error) {
      res.status(500).json({ message: "An error occurred while updating meeting" });
    }
  });

  app.delete("/api/meetings/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const meetingId = req.params.id;
    const meeting = await storage.getMeeting(meetingId);
    
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }
    
    if (meeting.userId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      await storage.deleteMeeting(meetingId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "An error occurred while deleting meeting" });
    }
  });

  // Notes Routes
  app.get("/api/notes", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const notes = await storage.getNotes(req.user.id);
    res.json(notes);
  });

  app.post("/api/notes", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const data = insertNoteSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const note = await storage.createNote(data);
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "An error occurred while creating note" });
    }
  });

  app.patch("/api/notes/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const noteId = req.params.id;
    const note = await storage.getNote(noteId);
    
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    
    if (note.userId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const updatedNote = await storage.updateNote(noteId, req.body);
      res.json(updatedNote);
    } catch (error) {
      res.status(500).json({ message: "An error occurred while updating note" });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const noteId = req.params.id;
    const note = await storage.getNote(noteId);
    
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    
    if (note.userId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      await storage.deleteNote(noteId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "An error occurred while deleting note" });
    }
  });

  // Tags Routes
  app.get("/api/tags", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const tags = await storage.getTags(req.user.id);
    res.json(tags);
  });

  app.post("/api/tags", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const data = insertTagSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const tag = await storage.createTag(data);
      res.status(201).json(tag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "An error occurred while creating tag" });
    }
  });

  app.patch("/api/tags/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const tagId = req.params.id;
    const tag = await storage.getTag(tagId);
    
    if (!tag) {
      return res.status(404).json({ message: "Tag not found" });
    }
    
    if (tag.userId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const updatedTag = await storage.updateTag(tagId, req.body);
      res.json(updatedTag);
    } catch (error) {
      res.status(500).json({ message: "An error occurred while updating tag" });
    }
  });

  app.delete("/api/tags/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const tagId = req.params.id;
    const tag = await storage.getTag(tagId);
    
    if (!tag) {
      return res.status(404).json({ message: "Tag not found" });
    }
    
    if (tag.userId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      await storage.deleteTag(tagId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "An error occurred while deleting tag" });
    }
  });

  // Add health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Register global error handling middleware
  app.use(errorHandler);

  // Create and return the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}