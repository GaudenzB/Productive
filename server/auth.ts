import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";
import { BadRequestError, NotFoundError, UnauthorizedError } from "./errors";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET || randomBytes(32).toString("hex");
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours (reduced from 30 days for better security)
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'lax' // Provides CSRF protection with better UX than 'strict'
    },
    name: 'producti.sid', // Custom name instead of default "connect.sid"
    rolling: true, // Reset cookie expiration on user activity
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { 
        usernameField: 'email',
        passwordField: 'password' 
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Invalid email or password" });
          } else {
            return done(null, user);
          }
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, name } = req.body;
      
      if (!email || !password) {
        throw new BadRequestError("Email and password are required");
      }
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        throw new BadRequestError("An account with this email already exists");
      }

      const user = await storage.createUser({
        email,
        password: await hashPassword(password),
        name: name || null,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        
        // Create a safe user response object without sensitive data
        const userResponse = {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        };
        
        res.status(201).json(userResponse);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    if (!req.body.email || !req.body.password) {
      return next(new BadRequestError("Email and password are required"));
    }
    
    passport.authenticate("local", (err: Error, user: User, info: {message: string}) => {
      if (err) return next(err);
      if (!user) return next(new UnauthorizedError(info?.message || "Invalid email or password"));
      
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        
        // Create a safe user response object without sensitive data
        const userResponse = {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        };
        
        return res.status(200).json(userResponse);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        throw new UnauthorizedError("You must be logged in to access this resource");
      }
      
      // Create a safe user response object without sensitive data
      const userResponse = {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        image: req.user.image,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt
      };
      
      res.json(userResponse);
    } catch (error) {
      next(error);
    }
  });
}
