import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';
import { storage } from '../../server/storage';

// Mock the storage interface
jest.mock('../../server/storage', () => ({
  storage: {
    getTasks: jest.fn(),
    getTask: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    getUserByEmail: jest.fn(),
    getUser: jest.fn(),
  },
  sessionStore: {
    get: jest.fn(),
    set: jest.fn(),
    destroy: jest.fn(),
  }
}));

// Mock authentication
const mockIsAuthenticated = jest.fn().mockReturnValue(true);
const mockUser = {
  id: 'user1',
  email: 'test@example.com',
  name: 'Test User'
};

// Express app setup for testing
let app: express.Express;
let server: any;

beforeAll(async () => {
  app = express();
  
  // Mock authentication middleware
  app.use((req: any, res, next) => {
    req.isAuthenticated = mockIsAuthenticated;
    req.user = mockUser;
    next();
  });
  
  server = await registerRoutes(app);
});

afterAll(() => {
  if (server && server.close) {
    server.close();
  }
});

describe('Task API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/tasks returns tasks for authenticated user', async () => {
    const mockTasks = [
      {
        id: '1',
        title: 'Test Task',
        description: 'Test Description',
        status: 'TODO',
        priority: 'HIGH',
        userId: 'user1',
      }
    ];
    
    (storage.getTasks as jest.Mock).mockResolvedValue(mockTasks);
    
    const response = await request(app).get('/api/tasks');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockTasks);
    expect(storage.getTasks).toHaveBeenCalledWith('user1');
  });
  
  test('POST /api/tasks creates a new task', async () => {
    const newTask = {
      title: 'New Task',
      description: 'New Task Description',
      status: 'TODO',
      priority: 'MEDIUM',
    };
    
    const createdTask = {
      id: '3',
      ...newTask,
      userId: 'user1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    (storage.createTask as jest.Mock).mockResolvedValue(createdTask);
    
    const response = await request(app)
      .post('/api/tasks')
      .send(newTask);
    
    expect(response.status).toBe(201);
    expect(response.body).toEqual(createdTask);
    expect(storage.createTask).toHaveBeenCalledWith(expect.objectContaining({
      ...newTask,
      userId: 'user1'
    }));
  });
  
  test('PATCH /api/tasks/:id updates a task', async () => {
    const taskId = '1';
    const taskUpdate = {
      title: 'Updated Task',
      status: 'COMPLETED',
    };
    
    const existingTask = {
      id: taskId,
      title: 'Test Task',
      description: 'Test Description',
      status: 'TODO',
      priority: 'HIGH',
      userId: 'user1',
    };
    
    const updatedTask = {
      ...existingTask,
      ...taskUpdate,
      updatedAt: new Date().toISOString(),
    };
    
    (storage.getTask as jest.Mock).mockResolvedValue(existingTask);
    (storage.updateTask as jest.Mock).mockResolvedValue(updatedTask);
    
    const response = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .send(taskUpdate);
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual(updatedTask);
    expect(storage.getTask).toHaveBeenCalledWith(taskId);
    expect(storage.updateTask).toHaveBeenCalledWith(taskId, taskUpdate);
  });
  
  test('DELETE /api/tasks/:id deletes a task', async () => {
    const taskId = '1';
    
    const existingTask = {
      id: taskId,
      title: 'Test Task',
      description: 'Test Description',
      status: 'TODO',
      priority: 'HIGH',
      userId: 'user1',
    };
    
    (storage.getTask as jest.Mock).mockResolvedValue(existingTask);
    (storage.deleteTask as jest.Mock).mockResolvedValue(undefined);
    
    const response = await request(app).delete(`/api/tasks/${taskId}`);
    
    expect(response.status).toBe(204);
    expect(storage.getTask).toHaveBeenCalledWith(taskId);
    expect(storage.deleteTask).toHaveBeenCalledWith(taskId);
  });
  
  test('GET /api/tasks returns 401 for unauthenticated user', async () => {
    mockIsAuthenticated.mockReturnValueOnce(false);
    
    const response = await request(app).get('/api/tasks');
    
    expect(response.status).toBe(401);
    expect(storage.getTasks).not.toHaveBeenCalled();
  });
});

describe('Health Check Endpoint', () => {
  test('GET /api/health returns OK', async () => {
    const response = await request(app).get('/api/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('timestamp');
  });
});