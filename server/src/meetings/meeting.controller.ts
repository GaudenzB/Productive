import { Request, Response, NextFunction } from 'express';
import { MeetingService } from './meeting.service';
import { UnauthorizedError } from '../common/error.middleware';

export class MeetingController {
  private meetingService: MeetingService;
  
  constructor() {
    this.meetingService = new MeetingService();
  }
  
  getMeetings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure the user is authenticated
      if (!req.user || !req.isAuthenticated()) {
        return next(new UnauthorizedError());
      }
      
      const meetings = await this.meetingService.getMeetings(req.user.id);
      res.json(meetings);
    } catch (error) {
      next(error);
    }
  }
  
  getMeeting = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure the user is authenticated
      if (!req.user || !req.isAuthenticated()) {
        return next(new UnauthorizedError());
      }
      
      const meeting = await this.meetingService.getMeeting(req.params.id);
      
      // Ensure the meeting belongs to the current user
      if (meeting.userId !== req.user.id) {
        return next(new UnauthorizedError());
      }
      
      res.json(meeting);
    } catch (error) {
      next(error);
    }
  }
  
  createMeeting = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure the user is authenticated
      if (!req.user || !req.isAuthenticated()) {
        return next(new UnauthorizedError());
      }
      
      // Add the user ID to the meeting data
      const meetingData = {
        ...req.body,
        userId: req.user.id
      };
      
      const meeting = await this.meetingService.createMeeting(meetingData);
      res.status(201).json(meeting);
    } catch (error) {
      next(error);
    }
  }
  
  updateMeeting = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure the user is authenticated
      if (!req.user || !req.isAuthenticated()) {
        return next(new UnauthorizedError());
      }
      
      // First check if the meeting belongs to the user
      const existingMeeting = await this.meetingService.getMeeting(req.params.id);
      
      if (existingMeeting.userId !== req.user.id) {
        return next(new UnauthorizedError());
      }
      
      const updatedMeeting = await this.meetingService.updateMeeting(req.params.id, req.body);
      res.json(updatedMeeting);
    } catch (error) {
      next(error);
    }
  }
  
  deleteMeeting = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure the user is authenticated
      if (!req.user || !req.isAuthenticated()) {
        return next(new UnauthorizedError());
      }
      
      // First check if the meeting belongs to the user
      const existingMeeting = await this.meetingService.getMeeting(req.params.id);
      
      if (existingMeeting.userId !== req.user.id) {
        return next(new UnauthorizedError());
      }
      
      await this.meetingService.deleteMeeting(req.params.id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }
}