import { Router } from 'express';
import { MeetingController } from './meeting.controller';
import { validate } from '../common/validation.middleware';
import { insertMeetingSchema } from '@shared/schema';
import { z } from 'zod';

// Create a meeting router
const meetingRouter = Router();
const meetingController = new MeetingController();

// Define validation schemas
const updateMeetingSchema = insertMeetingSchema.partial();
const meetingIdParamSchema = z.object({
  id: z.string().min(1)
});

// GET /api/meetings - Get all meetings for the current user
meetingRouter.get('/', meetingController.getMeetings);

// GET /api/meetings/:id - Get a specific meeting
meetingRouter.get('/:id', 
  validate(meetingIdParamSchema, 'params'),
  meetingController.getMeeting
);

// POST /api/meetings - Create a new meeting
meetingRouter.post('/',
  validate(insertMeetingSchema),
  meetingController.createMeeting
);

// PATCH /api/meetings/:id - Update a meeting
meetingRouter.patch('/:id',
  validate(meetingIdParamSchema, 'params'),
  validate(updateMeetingSchema),
  meetingController.updateMeeting
);

// DELETE /api/meetings/:id - Delete a meeting
meetingRouter.delete('/:id',
  validate(meetingIdParamSchema, 'params'),
  meetingController.deleteMeeting
);

export default meetingRouter;