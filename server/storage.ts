import { 
  User, 
  InsertUser, 
  Task, 
  InsertTask,
  Project, 
  InsertProject,
  Meeting, 
  InsertMeeting,
  Note, 
  InsertNote,
  Tag, 
  InsertTag
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { users, tasks, projects, meetings, notes, tags } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Define storage interface
export interface IStorage {
  sessionStore: session.SessionStore;
  
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Task methods
  getTasks(userId: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, data: Partial<Task>): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  
  // Project methods
  getProjects(userId: string): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, data: Partial<Project>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  
  // Meeting methods
  getMeetings(userId: string): Promise<Meeting[]>;
  getMeeting(id: string): Promise<Meeting | undefined>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(id: string, data: Partial<Meeting>): Promise<Meeting>;
  deleteMeeting(id: string): Promise<void>;
  
  // Note methods
  getNotes(userId: string): Promise<Note[]>;
  getNote(id: string): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, data: Partial<Note>): Promise<Note>;
  deleteNote(id: string): Promise<void>;
  
  // Tag methods
  getTags(userId: string): Promise<Tag[]>;
  getTag(id: string): Promise<Tag | undefined>;
  createTag(tag: InsertTag): Promise<Tag>;
  updateTag(id: string, data: Partial<Tag>): Promise<Tag>;
  deleteTag(id: string): Promise<void>;
}

// Memory storage implementation for development
export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private tasks: Map<string, Task>;
  private projects: Map<string, Project>;
  private meetings: Map<string, Meeting>;
  private notes: Map<string, Note>;
  private tags: Map<string, Tag>;
  sessionStore: session.SessionStore;
  
  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.projects = new Map();
    this.meetings = new Map();
    this.notes = new Map();
    this.tags = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
  }
  
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const id = `user_${Date.now()}`;
    const createdAt = new Date();
    const updatedAt = createdAt;
    
    const user: User = {
      id,
      ...userData,
      image: null,
      createdAt,
      updatedAt
    };
    
    this.users.set(id, user);
    return user;
  }
  
  // Task methods
  async getTasks(userId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.userId === userId);
  }
  
  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async createTask(taskData: InsertTask): Promise<Task> {
    const id = `task_${Date.now()}`;
    const createdAt = new Date();
    const updatedAt = createdAt;
    
    const task: Task = {
      id,
      ...taskData,
      createdAt,
      updatedAt
    };
    
    this.tasks.set(id, task);
    return task;
  }
  
  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    const task = this.tasks.get(id);
    if (!task) {
      throw new Error("Task not found");
    }
    
    const updatedTask = {
      ...task,
      ...data,
      updatedAt: new Date()
    };
    
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  async deleteTask(id: string): Promise<void> {
    this.tasks.delete(id);
  }
  
  // Project methods
  async getProjects(userId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(project => project.userId === userId);
  }
  
  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  
  async createProject(projectData: InsertProject): Promise<Project> {
    const id = `project_${Date.now()}`;
    const createdAt = new Date();
    const updatedAt = createdAt;
    
    const project: Project = {
      id,
      ...projectData,
      createdAt,
      updatedAt
    };
    
    this.projects.set(id, project);
    return project;
  }
  
  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const project = this.projects.get(id);
    if (!project) {
      throw new Error("Project not found");
    }
    
    const updatedProject = {
      ...project,
      ...data,
      updatedAt: new Date()
    };
    
    this.projects.set(id, updatedProject);
    return updatedProject;
  }
  
  async deleteProject(id: string): Promise<void> {
    this.projects.delete(id);
  }
  
  // Meeting methods
  async getMeetings(userId: string): Promise<Meeting[]> {
    return Array.from(this.meetings.values()).filter(meeting => meeting.userId === userId);
  }
  
  async getMeeting(id: string): Promise<Meeting | undefined> {
    return this.meetings.get(id);
  }
  
  async createMeeting(meetingData: InsertMeeting): Promise<Meeting> {
    const id = `meeting_${Date.now()}`;
    const createdAt = new Date();
    const updatedAt = createdAt;
    
    const meeting: Meeting = {
      id,
      ...meetingData,
      createdAt,
      updatedAt
    };
    
    this.meetings.set(id, meeting);
    return meeting;
  }
  
  async updateMeeting(id: string, data: Partial<Meeting>): Promise<Meeting> {
    const meeting = this.meetings.get(id);
    if (!meeting) {
      throw new Error("Meeting not found");
    }
    
    const updatedMeeting = {
      ...meeting,
      ...data,
      updatedAt: new Date()
    };
    
    this.meetings.set(id, updatedMeeting);
    return updatedMeeting;
  }
  
  async deleteMeeting(id: string): Promise<void> {
    this.meetings.delete(id);
  }
  
  // Note methods
  async getNotes(userId: string): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(note => note.userId === userId);
  }
  
  async getNote(id: string): Promise<Note | undefined> {
    return this.notes.get(id);
  }
  
  async createNote(noteData: InsertNote): Promise<Note> {
    const id = `note_${Date.now()}`;
    const createdAt = new Date();
    const updatedAt = createdAt;
    
    const note: Note = {
      id,
      ...noteData,
      createdAt,
      updatedAt
    };
    
    this.notes.set(id, note);
    return note;
  }
  
  async updateNote(id: string, data: Partial<Note>): Promise<Note> {
    const note = this.notes.get(id);
    if (!note) {
      throw new Error("Note not found");
    }
    
    const updatedNote = {
      ...note,
      ...data,
      updatedAt: new Date()
    };
    
    this.notes.set(id, updatedNote);
    return updatedNote;
  }
  
  async deleteNote(id: string): Promise<void> {
    this.notes.delete(id);
  }
  
  // Tag methods
  async getTags(userId: string): Promise<Tag[]> {
    return Array.from(this.tags.values()).filter(tag => tag.userId === userId);
  }
  
  async getTag(id: string): Promise<Tag | undefined> {
    return this.tags.get(id);
  }
  
  async createTag(tagData: InsertTag): Promise<Tag> {
    const id = `tag_${Date.now()}`;
    const createdAt = new Date();
    const updatedAt = createdAt;
    
    const tag: Tag = {
      id,
      ...tagData,
      createdAt,
      updatedAt
    };
    
    this.tags.set(id, tag);
    return tag;
  }
  
  async updateTag(id: string, data: Partial<Tag>): Promise<Tag> {
    const tag = this.tags.get(id);
    if (!tag) {
      throw new Error("Tag not found");
    }
    
    const updatedTag = {
      ...tag,
      ...data,
      updatedAt: new Date()
    };
    
    this.tags.set(id, updatedTag);
    return updatedTag;
  }
  
  async deleteTag(id: string): Promise<void> {
    this.tags.delete(id);
  }
}

// Database storage implementation for production
export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;
  
  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // In production with PostgreSQL, we'd use connect-pg-simple for the session store
    // this.sessionStore = new PostgresSessionStore({
    //   pool: pool,
    //   createTableIfMissing: true
    // });
  }
  
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  
  // Task methods
  async getTasks(userId: string): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.userId, userId));
  }
  
  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }
  
  async createTask(taskData: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(taskData).returning();
    return task;
  }
  
  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    const [updatedTask] = await db
      .update(tasks)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(tasks.id, id))
      .returning();
    
    return updatedTask;
  }
  
  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }
  
  // Project methods
  async getProjects(userId: string): Promise<Project[]> {
    return db.select().from(projects).where(eq(projects.userId, userId));
  }
  
  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }
  
  async createProject(projectData: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(projectData).returning();
    return project;
  }
  
  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(projects.id, id))
      .returning();
    
    return updatedProject;
  }
  
  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }
  
  // Meeting methods
  async getMeetings(userId: string): Promise<Meeting[]> {
    return db.select().from(meetings).where(eq(meetings.userId, userId));
  }
  
  async getMeeting(id: string): Promise<Meeting | undefined> {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    return meeting;
  }
  
  async createMeeting(meetingData: InsertMeeting): Promise<Meeting> {
    const [meeting] = await db.insert(meetings).values(meetingData).returning();
    return meeting;
  }
  
  async updateMeeting(id: string, data: Partial<Meeting>): Promise<Meeting> {
    const [updatedMeeting] = await db
      .update(meetings)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(meetings.id, id))
      .returning();
    
    return updatedMeeting;
  }
  
  async deleteMeeting(id: string): Promise<void> {
    await db.delete(meetings).where(eq(meetings.id, id));
  }
  
  // Note methods
  async getNotes(userId: string): Promise<Note[]> {
    return db.select().from(notes).where(eq(notes.userId, userId));
  }
  
  async getNote(id: string): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note;
  }
  
  async createNote(noteData: InsertNote): Promise<Note> {
    const [note] = await db.insert(notes).values(noteData).returning();
    return note;
  }
  
  async updateNote(id: string, data: Partial<Note>): Promise<Note> {
    const [updatedNote] = await db
      .update(notes)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(notes.id, id))
      .returning();
    
    return updatedNote;
  }
  
  async deleteNote(id: string): Promise<void> {
    await db.delete(notes).where(eq(notes.id, id));
  }
  
  // Tag methods
  async getTags(userId: string): Promise<Tag[]> {
    return db.select().from(tags).where(eq(tags.userId, userId));
  }
  
  async getTag(id: string): Promise<Tag | undefined> {
    const [tag] = await db.select().from(tags).where(eq(tags.id, id));
    return tag;
  }
  
  async createTag(tagData: InsertTag): Promise<Tag> {
    const [tag] = await db.insert(tags).values(tagData).returning();
    return tag;
  }
  
  async updateTag(id: string, data: Partial<Tag>): Promise<Tag> {
    const [updatedTag] = await db
      .update(tags)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(tags.id, id))
      .returning();
    
    return updatedTag;
  }
  
  async deleteTag(id: string): Promise<void> {
    await db.delete(tags).where(eq(tags.id, id));
  }
}

// Use MemStorage for development and DatabaseStorage for production
export const storage: IStorage = process.env.NODE_ENV === "production" && process.env.DATABASE_URL
  ? new DatabaseStorage()
  : new MemStorage();
