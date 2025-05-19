import { db } from '../common/db';
import { notes } from '@shared/schema';
import { Note, InsertNote } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { NotFoundError } from '../common/error.middleware';
import { v4 as uuidv4 } from 'uuid';

export class NoteService {
  async getNotes(userId: string): Promise<Note[]> {
    // First get all notes for the user
    const userNotes = await db.select().from(notes).where(eq(notes.userId, userId));
    
    // Then sort them manually by createdAt in descending order
    return userNotes.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getNote(id: string): Promise<Note> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    
    if (!note) {
      throw new NotFoundError(`Note with id ${id} not found`);
    }
    
    return note;
  }

  async createNote(noteData: InsertNote): Promise<Note> {
    const id = uuidv4();
    const [note] = await db.insert(notes)
      .values({
        id,
        ...noteData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
      
    return note;
  }

  async updateNote(id: string, data: Partial<Note>): Promise<Note> {
    const [updatedNote] = await db.update(notes)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(notes.id, id))
      .returning();
      
    if (!updatedNote) {
      throw new NotFoundError(`Note with id ${id} not found`);
    }
    
    return updatedNote;
  }

  async deleteNote(id: string): Promise<void> {
    const result = await db.delete(notes).where(eq(notes.id, id));
    
    if (!result) {
      throw new NotFoundError(`Note with id ${id} not found`);
    }
  }
}