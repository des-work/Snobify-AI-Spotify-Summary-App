interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: string;
  message: string;
  data?: any;
  stack?: string;
}

class DebugLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private isEnabled = true;

  constructor() {
    // Enable debug mode in development
    this.isEnabled = process.env.NODE_ENV === 'development' || 
                     localStorage.getItem('snobify_debug') === 'true';
  }

  private addLog(level: LogEntry['level'], category: string, message: string, data?: any) {
    if (!this.isEnabled) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      stack: level === 'error' ? new Error().stack : undefined
    };

    this.logs.push(entry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console logging with colors
    const colors = {
      debug: '#6b7280',
      info: '#3b82f6',
      warn: '#f59e0b',
      error: '#ef4444'
    };

    const emoji = {
      debug: '🐛',
      info: 'ℹ️',
      warn: '⚠️',
      error: '🚨'
    };

    console.log(
      `%c${emoji[level]} [${category}] ${message}`,
      `color: ${colors[level]}; font-weight: bold;`,
      data || ''
    );

    // Store in localStorage for persistence
    try {
      localStorage.setItem('snobify_logs', JSON.stringify(this.logs.slice(-100)));
    } catch (e) {
      console.warn('Could not save logs to localStorage:', e);
    }
  }

  debug(category: string, message: string, data?: any) {
    this.addLog('debug', category, message, data);
  }

  info(category: string, message: string, data?: any) {
    this.addLog('info', category, message, data);
  }

  warn(category: string, message: string, data?: any) {
    this.addLog('warn', category, message, data);
  }

  error(category: string, message: string, data?: any) {
    this.addLog('error', category, message, data);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
    localStorage.removeItem('snobify_logs');
  }

  exportLogs(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      logs: this.logs
    }, null, 2);
  }

  enable() {
    this.isEnabled = true;
    localStorage.setItem('snobify_debug', 'true');
  }

  disable() {
    this.isEnabled = false;
    localStorage.removeItem('snobify_debug');
  }
}

export const logger = new DebugLogger();

// Global error handler
window.addEventListener('error', (event) => {
  logger.error('GLOBAL_ERROR', 'Unhandled error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('GLOBAL_PROMISE_REJECTION', 'Unhandled promise rejection', {
    reason: event.reason,
    promise: event.promise
  });
});
