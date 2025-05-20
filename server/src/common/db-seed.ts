import { db } from './db';
import { users, tasks, projects, meetings, notes, tags } from '@shared/schema';
import { v4 as uuidv4 } from 'uuid';
import { sql } from 'drizzle-orm';

/**
 * Seed the database with initial data for development and testing
 * This should only be run in development or test environments, never in production
 */
export async function seedDatabase() {
  console.log('Seeding database with initial data...');
  
  try {
    // Check if database already has data
    const [userCount] = await db.select({ count: sql`count(*)` }).from(users);
    
    if (Number(userCount.count) > 0) {
      console.log('Database already has data, skipping seed');
      return;
    }
    
    // Create test user
    const userId = uuidv4();
    await db.insert(users).values({
      id: userId,
      name: 'Test User',
      email: 'test@example.com',
      password: '$2b$10$TaKrAQHxQtmXE8AQzLO.L.kZ4Ae6EiUbvmGSUQZYTAQvxWFOS9J5q', // "password123"
      image: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Create test projects
    const projectIds = [uuidv4(), uuidv4(), uuidv4()];
    await db.insert(projects).values([
      {
        id: projectIds[0],
        title: 'Work Project',
        description: 'Important work-related tasks and deadlines',
        status: 'ACTIVE',
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: projectIds[1],
        title: 'Personal Project',
        description: 'Side project for learning new skills',
        status: 'ACTIVE',
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: projectIds[2],
        title: 'Home Renovation',
        description: 'Planning and tracking home improvement tasks',
        status: 'ACTIVE',
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    
    // Create test tasks
    await db.insert(tasks).values([
      {
        id: uuidv4(),
        title: 'Complete project proposal',
        description: 'Write up the proposal for the client meeting',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        userId,
        projectId: projectIds[0],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        title: 'Research new technologies',
        description: 'Look into new frameworks for the side project',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        userId,
        projectId: projectIds[1],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        title: 'Buy paint supplies',
        description: 'Get paint, brushes, and drop cloths',
        status: 'TODO',
        priority: 'LOW',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        userId,
        projectId: projectIds[2],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    
    // Create test meetings
    await db.insert(meetings).values([
      {
        id: uuidv4(),
        title: 'Client Presentation',
        description: 'Present project proposal to the client',
        startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 1 hour later
        duration: '60 minutes',
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        title: 'Team Standup',
        description: 'Daily team check-in',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // 30 mins later
        duration: '30 minutes',
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    
    // Create test notes
    await db.insert(notes).values([
      {
        id: uuidv4(),
        title: 'Project Ideas',
        content: 'Brainstorming ideas for the next project:\n- Mobile app for productivity\n- Web dashboard for analytics\n- API integration service',
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        title: 'Meeting Notes',
        content: 'Key points from the last meeting:\n1. Need to deliver proposal by Friday\n2. Budget concerns need to be addressed\n3. Timeline should be realistic',
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    
    // Create test tags
    await db.insert(tags).values([
      {
        id: uuidv4(),
        name: 'Work',
        color: '#4A90E2',
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Personal',
        color: '#50E3C2',
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Urgent',
        color: '#E74C3C',
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}