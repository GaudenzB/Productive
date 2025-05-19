import { db } from '../common/db';
import { meetings } from '@shared/schema';
import { Meeting, InsertMeeting } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { NotFoundError } from '../common/error.middleware';
import { v4 as uuidv4 } from 'uuid';

export class MeetingService {
  async getMeetings(userId: string): Promise<Meeting[]> {
    return db.select().from(meetings).where(eq(meetings.userId, userId))
      .orderBy(meetings.startTime);
  }

  async getMeeting(id: string): Promise<Meeting> {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    
    if (!meeting) {
      throw new NotFoundError(`Meeting with id ${id} not found`);
    }
    
    return meeting;
  }

  async createMeeting(meetingData: InsertMeeting): Promise<Meeting> {
    const id = uuidv4();
    
    // Calculate duration based on start and end times if not provided
    let duration = meetingData.duration;
    if (!duration && meetingData.startTime && meetingData.endTime) {
      const startTime = new Date(meetingData.startTime);
      const endTime = new Date(meetingData.endTime);
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
      duration = `${durationMinutes} minutes`;
    }
    
    const [meeting] = await db.insert(meetings)
      .values({
        id,
        ...meetingData,
        duration: duration || '0 minutes',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
      
    return meeting;
  }

  async updateMeeting(id: string, data: Partial<Meeting>): Promise<Meeting> {
    // If start or end time changed, recalculate duration
    let updatedData = { ...data };
    
    if ((data.startTime || data.endTime) && !data.duration) {
      // Get current meeting data to have both times
      const currentMeeting = await this.getMeeting(id);
      const startTime = data.startTime ? new Date(data.startTime) : new Date(currentMeeting.startTime);
      const endTime = data.endTime ? new Date(data.endTime) : new Date(currentMeeting.endTime);
      
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
      updatedData.duration = `${durationMinutes} minutes`;
    }
    
    const [updatedMeeting] = await db.update(meetings)
      .set({
        ...updatedData,
        updatedAt: new Date()
      })
      .where(eq(meetings.id, id))
      .returning();
      
    if (!updatedMeeting) {
      throw new NotFoundError(`Meeting with id ${id} not found`);
    }
    
    return updatedMeeting;
  }

  async deleteMeeting(id: string): Promise<void> {
    const result = await db.delete(meetings).where(eq(meetings.id, id));
    
    if (!result) {
      throw new NotFoundError(`Meeting with id ${id} not found`);
    }
  }
}