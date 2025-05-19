import { db } from '../common/db';
import { users } from '@shared/schema';
import { User, InsertUser } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { NotFoundError, UnauthorizedError } from '../common/error.middleware';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const scryptAsync = promisify(scrypt);

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString('hex')}.${salt}`;
  }

  async comparePasswords(supplied: string, stored: string): Promise<boolean> {
    const [hashed, salt] = stored.split('.');
    const hashedBuf = Buffer.from(hashed, 'hex');
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  }

  async getUserById(id: string): Promise<User> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    
    if (!user) {
      throw new NotFoundError(`User with id ${id} not found`);
    }
    
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    // Check if user already exists
    const existingUser = await this.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash the password
    const hashedPassword = await this.hashPassword(userData.password);
    
    // Create the user with a UUID
    const id = uuidv4();
    const [user] = await db.insert(users)
      .values({
        id,
        ...userData,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
      
    return user;
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.getUserByEmail(email);
    
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }
    
    const isPasswordValid = await this.comparePasswords(password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }
    
    return user;
  }
}