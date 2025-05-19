import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { BadRequestError } from '../common/error.middleware';
import passport from 'passport';
import { User } from '@shared/schema';

export class AuthController {
  private authService: AuthService;
  
  constructor() {
    this.authService = new AuthService();
  }
  
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if the user already exists
      const existingUser = await this.authService.getUserByEmail(req.body.email);
      if (existingUser) {
        return next(new BadRequestError('Email already exists'));
      }

      // Create the user
      const user = await this.authService.createUser(req.body);
      
      // Log the user in automatically
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Return the user without the password
        const { password, ...userWithoutPassword } = user;
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  }
  
  login = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('local', (err: Error, user: User) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return next(new BadRequestError('Invalid email or password'));
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }
        
        // Return the user without the password
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  }
  
  logout = (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  }
  
  getCurrentUser = (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    
    // Return the user without the password
    const { password, ...userWithoutPassword } = req.user as User;
    return res.json(userWithoutPassword);
  }
}