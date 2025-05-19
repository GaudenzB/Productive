import type { Express } from "express";
import { createServer, type Server } from "http";

// Import feature routers from our new architecture
import taskRouter from './src/tasks/task.router';
import projectRouter from './src/projects/project.router';
import meetingRouter from './src/meetings/meeting.router';
import noteRouter from './src/notes/note.router';
import tagRouter from './src/tags/tag.router';
import authRouter from './src/auth/auth.router';
import { setupPassport } from './src/auth/passport.config';

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication with our new passport config
  setupPassport(app);

  // Register all feature routers
  app.use('/api/auth', authRouter);
  app.use('/api/tasks', taskRouter);
  app.use('/api/projects', projectRouter);
  app.use('/api/meetings', meetingRouter);
  app.use('/api/notes', noteRouter);
  app.use('/api/tags', tagRouter);
  
  // Add health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Create and return the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}