import { db } from './db';
import { executeQuery, withTransaction } from './db-transaction';
import { RecordNotFoundError } from './db-errors';
import { logger } from './logger';

/**
 * Base Service class that provides common CRUD operations
 * This can be extended by specific feature services to inherit standard functionality
 */
export abstract class BaseService<T, CreateDto, UpdateDto> {
  protected readonly entityName: string;
  
  constructor(entityName: string) {
    this.entityName = entityName;
  }
  
  /**
   * Get all records
   */
  public async getAll(filter?: Record<string, any>): Promise<T[]> {
    try {
      return await executeQuery(
        () => this.getAllQuery(filter),
        this.entityName,
        { filter }
      );
    } catch (error) {
      logger.error(`Failed to get all ${this.entityName}`, error as Error);
      throw error;
    }
  }
  
  /**
   * Get a single record by ID
   */
  public async getById(id: string): Promise<T> {
    try {
      const result = await executeQuery(
        () => this.getByIdQuery(id),
        this.entityName,
        { id }
      );
      
      if (!result) {
        throw new RecordNotFoundError(this.entityName, id);
      }
      
      return result;
    } catch (error) {
      logger.error(`Failed to get ${this.entityName} by ID: ${id}`, error as Error);
      throw error;
    }
  }
  
  /**
   * Create a new record
   */
  public async create(data: CreateDto): Promise<T> {
    try {
      return await withTransaction(
        (trx) => this.createQuery(data, trx),
        this.entityName
      );
    } catch (error) {
      logger.error(`Failed to create ${this.entityName}`, error as Error, { data });
      throw error;
    }
  }
  
  /**
   * Update an existing record
   */
  public async update(id: string, data: UpdateDto): Promise<T> {
    try {
      // First check if the record exists
      await this.getById(id);
      
      // Perform the update
      return await withTransaction(
        (trx) => this.updateQuery(id, data, trx),
        this.entityName
      );
    } catch (error) {
      logger.error(`Failed to update ${this.entityName} with ID: ${id}`, error as Error, { data });
      throw error;
    }
  }
  
  /**
   * Delete a record
   */
  public async delete(id: string): Promise<void> {
    try {
      // First check if the record exists
      await this.getById(id);
      
      // Perform the delete
      await withTransaction(
        (trx) => this.deleteQuery(id, trx),
        this.entityName
      );
    } catch (error) {
      logger.error(`Failed to delete ${this.entityName} with ID: ${id}`, error as Error);
      throw error;
    }
  }
  
  // Abstract methods to be implemented by specific services
  
  protected abstract getAllQuery(filter?: Record<string, any>): Promise<T[]>;
  
  protected abstract getByIdQuery(id: string): Promise<T | undefined>;
  
  protected abstract createQuery(data: CreateDto, trx?: any): Promise<T>;
  
  protected abstract updateQuery(id: string, data: UpdateDto, trx?: any): Promise<T>;
  
  protected abstract deleteQuery(id: string, trx?: any): Promise<void>;
}