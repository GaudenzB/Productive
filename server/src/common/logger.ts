import { env } from './env';

// Log levels in order of severity
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Log entry structure
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  service?: string;
  userId?: string;
  requestId?: string;
}

/**
 * Application Logger
 * Handles centralized logging with consistent formatting and context
 */
export class Logger {
  private static instance: Logger;
  private minLevel: LogLevel;
  private serviceName: string;

  private constructor() {
    // Set minimum log level based on environment
    this.minLevel = env.NODE_ENV === 'production' ? 'info' : 'debug';
    this.serviceName = 'productitask-api';
  }

  /**
   * Get singleton instance of logger
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Log a message at the debug level
   */
  public debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  /**
   * Log a message at the info level
   */
  public info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  /**
   * Log a message at the warn level
   */
  public warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  /**
   * Log a message at the error level
   */
  public error(message: string, error?: Error, context?: Record<string, any>): void {
    // Include error details in context if provided
    const errorContext = error ? {
      ...context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    } : context;
    
    this.log('error', message, errorContext);
  }

  /**
   * Log a message with the specified level and context
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    // Check if this level should be logged
    if (!this.shouldLog(level)) return;

    // Create log entry
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.serviceName,
      context: this.sanitizeContext(context),
    };

    // In production, you would typically send logs to a service
    // Here we're using console for simplicity
    
    // Format log for console
    const logPrefix = `[${entry.timestamp}] [${level.toUpperCase()}]`;
    
    switch (level) {
      case 'debug':
        console.debug(logPrefix, message, entry.context || '');
        break;
      case 'info':
        console.info(logPrefix, message, entry.context || '');
        break;
      case 'warn':
        console.warn(logPrefix, message, entry.context || '');
        break;
      case 'error':
        console.error(logPrefix, message, entry.context || '');
        break;
    }
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
   * Sanitize context data before logging to remove sensitive information
   */
  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined;
    
    // Create a deep copy to avoid modifying the original
    const sanitized = JSON.parse(JSON.stringify(context));
    
    // List of sensitive field names to redact
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'cookie', 'authorization'];
    
    // Recursively sanitize the context object
    this.redactSensitiveFields(sanitized, sensitiveFields);
    
    return sanitized;
  }

  /**
   * Recursively redact sensitive fields in an object
   */
  private redactSensitiveFields(obj: any, sensitiveFields: string[]): void {
    if (!obj || typeof obj !== 'object') return;
    
    for (const key in obj) {
      // Check if the current key should be redacted
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        obj[key] = '[REDACTED]';
      } 
      // Recursively check nested objects
      else if (typeof obj[key] === 'object') {
        this.redactSensitiveFields(obj[key], sensitiveFields);
      }
    }
  }
}

// Export a singleton instance for convenience
export const logger = Logger.getInstance();