import { db } from '../common/db';
import { tags } from '@shared/schema';
import { Tag, InsertTag } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { NotFoundError } from '../common/error.middleware';
import { v4 as uuidv4 } from 'uuid';

export class TagService {
  async getTags(userId: string): Promise<Tag[]> {
    return db.select().from(tags).where(eq(tags.userId, userId))
      .orderBy(tags.name);
  }

  async getTag(id: string): Promise<Tag> {
    const [tag] = await db.select().from(tags).where(eq(tags.id, id));
    
    if (!tag) {
      throw new NotFoundError(`Tag with id ${id} not found`);
    }
    
    return tag;
  }

  async createTag(tagData: InsertTag): Promise<Tag> {
    const id = uuidv4();
    
    // Set default color if not provided
    const color = tagData.color || '#CCCCCC';
    
    const [tag] = await db.insert(tags)
      .values({
        id,
        ...tagData,
        color,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
      
    return tag;
  }

  async updateTag(id: string, data: Partial<Tag>): Promise<Tag> {
    const [updatedTag] = await db.update(tags)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(tags.id, id))
      .returning();
      
    if (!updatedTag) {
      throw new NotFoundError(`Tag with id ${id} not found`);
    }
    
    return updatedTag;
  }

  async deleteTag(id: string): Promise<void> {
    const result = await db.delete(tags).where(eq(tags.id, id));
    
    if (!result) {
      throw new NotFoundError(`Tag with id ${id} not found`);
    }
  }
}