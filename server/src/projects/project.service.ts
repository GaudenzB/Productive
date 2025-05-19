import { db } from '../common/db';
import { projects } from '@shared/schema';
import { Project, InsertProject } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { NotFoundError } from '../common/error.middleware';
import { v4 as uuidv4 } from 'uuid';

export class ProjectService {
  async getProjects(userId: string): Promise<Project[]> {
    return db.select().from(projects).where(eq(projects.userId, userId))
      .orderBy(projects.createdAt);
  }

  async getProject(id: string): Promise<Project> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    
    if (!project) {
      throw new NotFoundError(`Project with id ${id} not found`);
    }
    
    return project;
  }

  async createProject(projectData: InsertProject): Promise<Project> {
    const id = uuidv4();
    const [project] = await db.insert(projects)
      .values({
        id,
        ...projectData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
      
    return project;
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const [updatedProject] = await db.update(projects)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(projects.id, id))
      .returning();
      
    if (!updatedProject) {
      throw new NotFoundError(`Project with id ${id} not found`);
    }
    
    return updatedProject;
  }

  async deleteProject(id: string): Promise<void> {
    const result = await db.delete(projects).where(eq(projects.id, id));
    
    if (!result) {
      throw new NotFoundError(`Project with id ${id} not found`);
    }
  }
}