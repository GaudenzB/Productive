import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Express } from 'express';
import session from 'express-session';
import { AuthService } from './auth.service';
import { User } from '@shared/schema';
import createMemoryStore from 'memorystore';

// Configure memory store for sessions
const MemoryStore = createMemoryStore(session);

declare global {
  namespace Express {
    // Define the user structure for the request.user property
    interface User {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
      createdAt: Date;
      updatedAt: Date;
    }
  }
}

export function setupPassport(app: Express) {
  const authService = new AuthService();
  
  // Configure session middleware
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'your-secret-key', // Should be environment variable in production
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  // In production, use PostgreSQL for session storage
  if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
    const connectPg = require('connect-pg-simple');
    const PostgresStore = connectPg(session);
    
    sessionSettings.store = new PostgresStore({
      connectionString: process.env.DATABASE_URL,
      createTableIfMissing: true
    });
  }

  // Set up session middleware
  app.set('trust proxy', 1);
  app.use(session(sessionSettings));
  
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy for username/password authentication
  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          // Validate the user's credentials
          const user = await authService.validateUser(email, password);
          return done(null, user);
        } catch (error) {
          return done(null, false);
        }
      }
    )
  );

  // Serialize user for session storage (just store the user ID)
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session (look up the user by ID)
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await authService.getUserById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}