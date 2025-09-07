import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../observability/logger.js';

export interface AppError extends Error {
  statusCode: number;
  code: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
  timestamp: string;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorCounts: Map<string, number> = new Map();
  private recentErrors: Array<{
    timestamp: string;
    error: string;
    count: number;
  }> = [];

  private constructor() {
    // Set up global error handlers
    process.on('uncaughtException', this.handleUncaughtException.bind(this));
    process.on('unhandledRejection', this.handleUnhandledRejection.bind(this));
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  public createError(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    context?: Record<string, any>
  ): AppError {
    const error = new Error(message) as AppError;
    error.statusCode = statusCode;
    error.code = code;
    error.severity = severity;
    error.context = context;
    error.timestamp = new Date().toISOString();
    return error;
  }

  public handleError(error: Error, request?: FastifyRequest, reply?: FastifyReply): void {
    const appError = this.normalizeError(error);
    
    // Log the error
    this.logError(appError, request);
    
    // Track error frequency
    this.trackError(appError);
    
    // Send response if reply is available
    if (reply && request) {
      this.sendErrorResponse(reply, appError, request);
    }
  }

  public async handleAsyncError(
    error: Error,
    request?: FastifyRequest,
    reply?: FastifyReply
  ): Promise<void> {
    return new Promise((resolve) => {
      try {
        this.handleError(error, request, reply);
        resolve();
      } catch (handlingError) {
        logger.error({
          originalError: error.message,
          handlingError: handlingError.message,
          stack: handlingError.stack
        }, 'Error in error handler');
        resolve();
      }
    });
  }

  private normalizeError(error: Error): AppError {
    if (this.isAppError(error)) {
      return error;
    }

    // Convert common errors to AppError
    if (error.name === 'ValidationError') {
      return this.createError(
        error.message,
        400,
        'VALIDATION_ERROR',
        'medium',
        { originalError: error.name }
      );
    }

    if (error.name === 'SyntaxError') {
      return this.createError(
        'Invalid JSON format',
        400,
        'INVALID_JSON',
        'medium',
        { originalError: error.name }
      );
    }

    if (error.message.includes('ECONNREFUSED')) {
      return this.createError(
        'Service unavailable',
        503,
        'SERVICE_UNAVAILABLE',
        'high',
        { originalError: error.message }
      );
    }

    if (error.message.includes('ENOENT')) {
      return this.createError(
        'File not found',
        404,
        'FILE_NOT_FOUND',
        'medium',
        { originalError: error.message }
      );
    }

    // Default to internal server error
    return this.createError(
      error.message || 'Internal server error',
      500,
      'INTERNAL_ERROR',
      'high',
      { originalError: error.name }
    );
  }

  private isAppError(error: Error): error is AppError {
    return 'statusCode' in error && 'code' in error && 'severity' in error;
  }

  private logError(error: AppError, request?: FastifyRequest): void {
    const logData = {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      severity: error.severity,
      timestamp: error.timestamp,
      context: error.context,
      stack: error.stack
    };

    if (request) {
      logData['request'] = {
        method: request.method,
        url: request.url,
        headers: request.headers,
        query: request.query,
        params: request.params
      };
    }

    switch (error.severity) {
      case 'critical':
        logger.fatal(logData, 'Critical error occurred');
        break;
      case 'high':
        logger.error(logData, 'High severity error occurred');
        break;
      case 'medium':
        logger.warn(logData, 'Medium severity error occurred');
        break;
      case 'low':
        logger.info(logData, 'Low severity error occurred');
        break;
    }
  }

  private trackError(error: AppError): void {
    const errorKey = `${error.code}:${error.message}`;
    const count = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, count + 1);

    // Update recent errors list
    const existingIndex = this.recentErrors.findIndex(e => e.error === errorKey);
    if (existingIndex >= 0) {
      this.recentErrors[existingIndex].count++;
      this.recentErrors[existingIndex].timestamp = error.timestamp;
    } else {
      this.recentErrors.unshift({
        timestamp: error.timestamp,
        error: errorKey,
        count: 1
      });
    }

    // Keep only last 50 errors
    if (this.recentErrors.length > 50) {
      this.recentErrors = this.recentErrors.slice(0, 50);
    }
  }

  private sendErrorResponse(reply: FastifyReply, error: AppError, request: FastifyRequest): void {
    const response = {
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        timestamp: error.timestamp
      },
      request: {
        method: request.method,
        url: request.url,
        id: request.id
      }
    };

    // Don't expose internal details in production
    if (process.env.NODE_ENV !== 'production') {
      response.error['context'] = error.context;
      response.error['stack'] = error.stack;
    }

    reply.status(error.statusCode).send(response);
  }

  private handleUncaughtException(error: Error): void {
    const appError = this.createError(
      `Uncaught Exception: ${error.message}`,
      500,
      'UNCAUGHT_EXCEPTION',
      'critical',
      { stack: error.stack }
    );

    this.logError(appError);
    
    logger.fatal({ error: appError }, 'Uncaught exception - server will exit');
    
    // Give time for logs to be written
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }

  private handleUnhandledRejection(reason: any, promise: Promise<any>): void {
    const errorMessage = reason instanceof Error ? reason.message : String(reason);
    const appError = this.createError(
      `Unhandled Promise Rejection: ${errorMessage}`,
      500,
      'UNHANDLED_REJECTION',
      'critical',
      { reason, promise: promise.toString() }
    );

    this.logError(appError);
    
    logger.fatal({ error: appError }, 'Unhandled promise rejection');
  }

  public getErrorStats(): {
    totalErrors: number;
    errorCounts: Record<string, number>;
    recentErrors: Array<{
      timestamp: string;
      error: string;
      count: number;
    }>;
  } {
    return {
      totalErrors: Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0),
      errorCounts: Object.fromEntries(this.errorCounts),
      recentErrors: this.recentErrors
    };
  }

  public clearErrorStats(): void {
    this.errorCounts.clear();
    this.recentErrors = [];
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();
