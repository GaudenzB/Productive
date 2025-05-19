import express, { Express, Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { log } from '../vite';
import { setupPassport } from './auth/passport.config';
import { errorHandler } from './common/error.middleware';

// Import feature routers
import taskRouter from './tasks/task.router';
import authRouter from './auth/auth.router';
import projectRouter from './projects/project.router';
import meetingRouter from './meetings/meeting.router';
import noteRouter from './notes/note.router';
import tagRouter from './tags/tag.router';

// Create Express app
const app: Express = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up authentication
setupPassport(app);

// API Routes
app.use('/api/tasks', taskRouter);
app.use('/api/auth', authRouter);
app.use('/api/projects', projectRouter);
app.use('/api/meetings', meetingRouter);
app.use('/api/notes', noteRouter);
app.use('/api/tags', tagRouter);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Global error handler
app.use(errorHandler);

// Create HTTP server
const httpServer = createServer(app);

// Export for use in main server file
export { app, httpServer };