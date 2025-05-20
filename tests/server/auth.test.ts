import request from 'supertest';
import express from 'express';
import { setupAuth } from '../../server/auth';
import { storage } from '../../server/storage';

// Mock the storage methods
jest.mock('../../server/storage', () => {
  const mockUser = {
    id: 'user1',
    email: 'test@example.com',
    password: 'hashedpassword.salt',
    name: 'Test User',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  return {
    storage: {
      getUserByEmail: jest.fn().mockImplementation(email => {
        if (email === 'test@example.com') {
          return Promise.resolve(mockUser);
        }
        return Promise.resolve(undefined);
      }),
      getUser: jest.fn().mockImplementation(id => {
        if (id === 'user1') {
          return Promise.resolve(mockUser);
        }
        return Promise.resolve(undefined);
      }),
      createUser: jest.fn().mockImplementation(userData => {
        return Promise.resolve({
          id: 'newuser1',
          ...userData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }),
      sessionStore: {
        get: jest.fn(),
        set: jest.fn(),
        destroy: jest.fn(),
      }
    }
  };
});

// Mock crypto functions used in auth.ts
jest.mock('crypto', () => {
  return {
    scrypt: (password, salt, keylen, callback) => {
      if (password === 'correctpassword' && salt === 'salt') {
        callback(null, Buffer.from('hashedpassword'));
      } else {
        callback(null, Buffer.from('wrongpassword'));
      }
    },
    randomBytes: (size) => {
      return {
        toString: () => 'salt'
      };
    },
    timingSafeEqual: (a, b) => {
      return a.toString() === b.toString();
    }
  };
});

// Set up express app with auth routes
const app = express();
app.use(express.json());

// Mock session middleware
app.use((req, res, next) => {
  req.session = {
    passport: {},
    save: cb => cb && cb(),
    destroy: cb => cb && cb(),
  };
  next();
});

// Add auth routes
setupAuth(app);

describe('Authentication Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Basic setup tests
  test('GET /api/user returns 401 when not authenticated', async () => {
    const response = await request(app).get('/api/user');
    expect(response.status).toBe(401);
  });

  // Registration tests
  test('POST /api/register creates a new user and logs them in', async () => {
    const userData = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
    };

    const response = await request(app)
      .post('/api/register')
      .send(userData);

    expect(response.status).toBe(201);
    expect(storage.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: userData.email,
        name: userData.name,
        password: expect.stringContaining('.salt'), // Should be hashed
      })
    );
    expect(response.body).toHaveProperty('id', 'newuser1');
    expect(response.body).toHaveProperty('email', userData.email);
  });

  test('POST /api/register returns 400 if username already exists', async () => {
    const userData = {
      email: 'test@example.com', // Email that already exists in mock
      password: 'password123',
      name: 'Existing User',
    };

    const response = await request(app)
      .post('/api/register')
      .send(userData);

    expect(response.status).toBe(400);
    expect(storage.createUser).not.toHaveBeenCalled();
  });
});