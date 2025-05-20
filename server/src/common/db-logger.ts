import { env } from './env';

// Logging levels
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Interface for a database operation
interface DatabaseOperation {
  operation: string;
  entity: string;
  params?: any;
  duration?: number;
  query?: string;
}

/**
 * Log database operations with appropriate level and formatting
 * In production, you would typically send these logs to a proper logging service
 */
export class DatabaseLogger {
  private static instance: DatabaseLogger;
  private minLevel: LogLevel;

  private constructor() {
    // Set minimum log level based on environment
    this.minLevel = env.NODE_ENV === 'production' ? 'info' : 'debug';
  }

  /**
   * Get the singleton instance of the logger
   */
  public static getInstance(): DatabaseLogger {
    if (!DatabaseLogger.instance) {
      DatabaseLogger.instance = new DatabaseLogger();
    }
    return DatabaseLogger.instance;
  }

  /**
   * Log a database operation at the appropriate level
   */
  public logOperation(level: LogLevel, operation: DatabaseOperation): void {
    if (!this.shouldLog(level)) return;

    const { operation: op, entity, params, duration, query } = operation;
    
    // Format the log message
    let message = `[DB] ${op.toUpperCase()} ${entity}`;
    
    // Add duration if available
    if (duration !== undefined) {
      message += ` (${duration}ms)`;
    }
    
    // Add query details in debug mode
    const details = {
      ...(params && { params: this.sanitizeParams(params) }),
      ...(query && { query }),
    };

    // Log with the appropriate level
    switch (level) {
      case 'debug':
        console.debug(message, details);
        break;
      case 'info':
        console.info(message, details);
        break;
      case 'warn':
        console.warn(message, details);
        break;
      case 'error':
        console.error(message, details);
        break;
    }
  }

  /**
   * Log a database query with timing information
   */
  public logQuery(entity: string, query: string, params: any, durationMs: number): void {
    this.logOperation('debug', {
      operation: 'query',
      entity,
      params,
      duration: durationMs,
      query,
    });
  }

  /**
   * Log a successful database operation
   */
  public logSuccess(operation: string, entity: string, params?: any, durationMs?: number): void {
    this.logOperation('info', {
      operation,
      entity,
      params,
      duration: durationMs,
    });
  }

  /**
   * Log a failed database operation
   */
  public logError(operation: string, entity: string, error: any, params?: any): void {
    this.logOperation('error', {
      operation,
      entity,
      params,
      query: error.query,
    });
    console.error('[DB ERROR]', error);
  }

  /**
   * Check if a log level should be logged based on the minimum level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    
    return levels[level] >= levels[this.minLevel];
  }

  /**
   * Sanitize sensitive parameters before logging
   */
  private sanitizeParams(params: any): any {
    if (!params) return params;
    
    // Create a shallow copy to avoid modifying the original
    const sanitized = { ...params };
    
    // Sanitize sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
}

// Export a singleton instance for convenience
export const dbLogger = DatabaseLogger.getInstance();