// ============================================================================
// ERROR HANDLER - Simple Implementation
// ============================================================================

export class ErrorHandler {
  private errorCount: number = 0;
  private errors: any[] = [];

  constructor() {
    console.log('ErrorHandler initialized');
  }

  async handleAsyncError(error: Error, request: any, reply: any): Promise<void> {
    this.errorCount++;
    this.errors.push({
      error: error.message,
      stack: error.stack,
      url: request?.url,
      timestamp: new Date().toISOString()
    });

    console.error('Server Error:', error.message);
    
    reply.status(500).send({
      error: {
        message: error.message,
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      }
    });
  }

  logError(error: Error, request?: any, reply?: any): void {
    this.errorCount++;
    this.errors.push({
      error: error.message,
      stack: error.stack,
      url: request?.url,
      timestamp: new Date().toISOString()
    });

    console.error('Logged Error:', error.message);
  }

  getErrorStats(): any {
    return {
      totalErrors: this.errorCount,
      recentErrors: this.errors.slice(-10)
    };
  }
}

export const errorHandler = new ErrorHandler();