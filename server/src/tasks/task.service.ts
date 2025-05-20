import { eq, and, desc } from 'drizzle-orm';
import { tasks } from '@shared/schema';
import { db } from '../common/db';
import { BaseService } from '../common/base.service';
import { RecordNotFoundError } from '../common/db-errors';
import { executeQuery, withTransaction } from '../common/db-transaction';
import { Task, InsertTask } from '@shared/schema';
import { randomUUID } from 'crypto';

/**
 * Task Service
 * Handles business logic for tasks
 */
export class TaskService extends BaseService<Task, InsertTask, Partial<Task>> {
  constructor() {
    super('Task');
  }

  /**
   * Get all tasks for a user
   */
  async getAllForUser(userId: string): Promise<Task[]> {
    return this.getAll({ userId });
  }
  
  /**
   * Get tasks by project
   */
  async getByProject(projectId: string, userId: string): Promise<Task[]> {
    return executeQuery(
      async () => {
        const results = await db
          .select()
          .from(tasks)
          .where(and(
            eq(tasks.projectId, projectId),
            eq(tasks.userId, userId)
          ))
          .orderBy(desc(tasks.dueDate));
        
        return results;
      },
      this.entityName,
      { projectId, userId }
    );
  }
  
  /**
   * Complete a task by ID
   */
  async completeTask(id: string, userId: string): Promise<Task> {
    // First check that the task exists and belongs to the user
    const task = await this.getTaskWithUserCheck(id, userId);
    
    // Update task to completed
    return this.update(id, { 
      completed: true,
      completedAt: new Date()
    });
  }
  
  /**
   * Mark a task as incomplete
   */
  async reopenTask(id: string, userId: string): Promise<Task> {
    // First check that the task exists and belongs to the user
    const task = await this.getTaskWithUserCheck(id, userId);
    
    // Update task to incomplete
    return this.update(id, { 
      completed: false,
      completedAt: null
    });
  }
  
  /**
   * Get all overdue tasks for a user
   */
  async getOverdueTasks(userId: string): Promise<Task[]> {
    return executeQuery(
      async () => {
        const now = new Date();
        
        const results = await db
          .select()
          .from(tasks)
          .where(and(
            eq(tasks.userId, userId),
            eq(tasks.completed, false)
          ))
          .orderBy(desc(tasks.dueDate));
        
        // Filter out tasks with no due date or future due date
        return results.filter(task => 
          task.dueDate && new Date(task.dueDate) < now
        );
      },
      this.entityName,
      { userId }
    );
  }
  
  /**
   * Get tasks due today for a user
   */
  async getTodaysTasks(userId: string): Promise<Task[]> {
    return executeQuery(
      async () => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const results = await db
          .select()
          .from(tasks)
          .where(and(
            eq(tasks.userId, userId),
            eq(tasks.completed, false)
          ))
          .orderBy(desc(tasks.priority));
        
        // Filter to include only tasks due today
        return results.filter(task => {
          if (!task.dueDate) return false;
          
          const dueDate = new Date(task.dueDate);
          return dueDate >= today && dueDate < tomorrow;
        });
      },
      this.entityName,
      { userId }
    );
  }
  
  /**
   * Get a task and verify it belongs to the user
   */
  private async getTaskWithUserCheck(id: string, userId: string): Promise<Task> {
    const task = await this.getById(id);
    
    // Verify the task belongs to the user
    if (task.userId !== userId) {
      throw new RecordNotFoundError(this.entityName, id);
    }
    
    return task;
  }
  
  // Implement abstract methods from BaseService
  
  protected async getAllQuery(filter?: Record<string, any>): Promise<Task[]> {
    // If userId filter is provided, fetch tasks for that user
    if (filter?.userId) {
      return db
        .select()
        .from(tasks)
        .where(eq(tasks.userId, filter.userId))
        .orderBy(desc(tasks.createdAt));
    }
    
    // Otherwise, fetch all tasks (for admin purposes)
    return db
      .select()
      .from(tasks)
      .orderBy(desc(tasks.createdAt));
  }
  
  protected async getByIdQuery(id: string): Promise<Task | undefined> {
    const results = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id));
    
    return results[0];
  }
  
  protected async createQuery(data: InsertTask, trx = db): Promise<Task> {
    // We need to explicitly type the insert values to make TypeScript happy
    const result = await trx
      .insert(tasks)
      .values({
        id: randomUUID(),
        title: data.title,
        description: data.description || null,
        status: data.status || 'TODO',
        priority: data.priority || 'MEDIUM',
        dueDate: data.dueDate || null,
        completed: false,
        completedAt: null,
        userId: data.userId,
        projectId: data.projectId || null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return result[0];
  }
  
  protected async updateQuery(id: string, data: Partial<Task>, trx = db): Promise<Task> {
    const result = await trx
      .update(tasks)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(tasks.id, id))
      .returning();
    
    return result[0];
  }
  
  protected async deleteQuery(id: string, trx = db): Promise<void> {
    await trx
      .delete(tasks)
      .where(eq(tasks.id, id));
  }
}