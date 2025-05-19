import { db } from '../common/db';
import { tasks } from '@shared/schema';
import { Task, InsertTask } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { NotFoundError } from '../common/error.middleware';
import { v4 as uuidv4 } from 'uuid';

export class TaskService {
  async getTasks(userId: string): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.userId, userId))
      .orderBy(tasks.createdAt);
  }

  async getTask(id: string): Promise<Task> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    
    if (!task) {
      throw new NotFoundError(`Task with id ${id} not found`);
    }
    
    return task;
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const id = uuidv4();
    const [task] = await db.insert(tasks)
      .values({
        id,
        ...taskData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
      
    return task;
  }

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    const [updatedTask] = await db.update(tasks)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(tasks.id, id))
      .returning();
      
    if (!updatedTask) {
      throw new NotFoundError(`Task with id ${id} not found`);
    }
    
    return updatedTask;
  }

  async deleteTask(id: string): Promise<void> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    
    if (!result) {
      throw new NotFoundError(`Task with id ${id} not found`);
    }
  }
}