import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../common/validation.middleware';
import { insertUserSchema } from '@shared/schema';
import { z } from 'zod';

// Create an auth router
const authRouter = Router();
const authController = new AuthController();

// Define validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

// POST /api/auth/register - Register a new user
authRouter.post('/register', 
  validate(insertUserSchema),
  authController.register
);

// POST /api/auth/login - Login a user
authRouter.post('/login', 
  validate(loginSchema),
  authController.login
);

// POST /api/auth/logout - Logout a user
authRouter.post('/logout', authController.logout);

// GET /api/auth/user - Get the current user
authRouter.get('/user', authController.getCurrentUser);

export default authRouter;