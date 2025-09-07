// ============================================================================
// CONNECTION MANAGER - Advanced API Connection Management
// ============================================================================

import { logger } from "../utils/debugLogger";

export interface ConnectionConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  healthCheckInterval: number;
  cacheTimeout: number;
}

export interface ConnectionStatus {
  isConnected: boolean;
  lastCheck: Date;
  latency: number;
  errors: number;
  uptime: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  expiresAt: Date;
  etag?: string;
}

class ConnectionManager {
  private config: ConnectionConfig;
  private status: ConnectionStatus;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private healthCheckTimer?: NodeJS.Timeout;
  private connectionListeners: Array<(status: ConnectionStatus) => void> = [];

  constructor(config: Partial<ConnectionConfig> = {}) {
    this.config = {
      baseUrl: config.baseUrl || '',
      timeout: config.timeout || 10000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      healthCheckInterval: config.healthCheckInterval || 30000,
      cacheTimeout: config.cacheTimeout || 300000, // 5 minutes
    };

    this.status = {
      isConnected: false,
      lastCheck: new Date(),
      latency: 0,
      errors: 0,
      uptime: 0,
    };

    this.startHealthCheck();
  }

  // ============================================================================
  // CONNECTION STATUS MANAGEMENT
  // ============================================================================

  public getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  public addConnectionListener(listener: (status: ConnectionStatus) => void): () => void {
    this.connectionListeners.push(listener);
    return () => {
      const index = this.connectionListeners.indexOf(listener);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }

  private notifyConnectionListeners(): void {
    this.connectionListeners.forEach(listener => {
      try {
        listener(this.status);
      } catch (error) {
        logger.error('CONNECTION_MANAGER', 'Error in connection listener', { error });
      }
    });
  }

  private updateStatus(updates: Partial<ConnectionStatus>): void {
    this.status = { ...this.status, ...updates };
    this.notifyConnectionListeners();
  }

  // ============================================================================
  // HEALTH CHECK SYSTEM
  // ============================================================================

  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);

    // Initial health check
    this.performHealthCheck();
  }

  private async performHealthCheck(): Promise<void> {
    const startTime = performance.now();
    
    try {
      const response = await this.makeRequest('/health', {
        method: 'GET',
        timeout: 5000,
        skipRetry: true,
        skipCache: true,
      });

      const latency = performance.now() - startTime;
      
      this.updateStatus({
        isConnected: true,
        lastCheck: new Date(),
        latency: Math.round(latency),
        errors: 0,
        uptime: Date.now() - this.status.lastCheck.getTime(),
      });

      logger.debug('CONNECTION_MANAGER', 'Health check passed', {
        latency: Math.round(latency),
        status: response.status,
      });

    } catch (error) {
      this.updateStatus({
        isConnected: false,
        lastCheck: new Date(),
        errors: this.status.errors + 1,
      });

      logger.warn('CONNECTION_MANAGER', 'Health check failed', {
        error: error instanceof Error ? error.message : String(error),
        errors: this.status.errors + 1,
      });
    }
  }

  // ============================================================================
  // CACHING SYSTEM
  // ============================================================================

  private getCacheKey(url: string, options: RequestInit = {}): string {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  private getCachedData<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (new Date() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCachedData<T>(key: string, data: T, etag?: string): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.cacheTimeout);

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
      etag,
    });

    // Clean up expired entries
    this.cleanupCache();
  }

  private cleanupCache(): void {
    const now = new Date();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // ============================================================================
  // REQUEST MANAGEMENT WITH RETRY LOGIC
  // ============================================================================

  public async makeRequest<T>(
    url: string,
    options: RequestInit & {
      timeout?: number;
      retryAttempts?: number;
      skipRetry?: boolean;
      skipCache?: boolean;
    } = {}
  ): Promise<T> {
    const {
      timeout = this.config.timeout,
      retryAttempts = this.config.retryAttempts,
      skipRetry = false,
      skipCache = false,
      ...fetchOptions
    } = options;

    const cacheKey = this.getCacheKey(url, fetchOptions);
    
    // Check cache first (only for GET requests)
    if (!skipCache && fetchOptions.method === 'GET' && !fetchOptions.method) {
      const cachedData = this.getCachedData<T>(cacheKey);
      if (cachedData) {
        logger.debug('CONNECTION_MANAGER', 'Cache hit', { url, cacheKey });
        return cachedData;
      }
    }

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= (skipRetry ? 1 : retryAttempts); attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(this.config.baseUrl + url, {
          ...fetchOptions,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...fetchOptions.headers,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Cache successful GET requests
        if (!skipCache && fetchOptions.method === 'GET' && !fetchOptions.method) {
          const etag = response.headers.get('etag') || undefined;
          this.setCachedData(cacheKey, data, etag);
        }

        // Update connection status on successful request
        if (attempt === 1) {
          this.updateStatus({
            isConnected: true,
            errors: Math.max(0, this.status.errors - 1),
          });
        }

        return data;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        logger.warn('CONNECTION_MANAGER', `Request attempt ${attempt} failed`, {
          url,
          attempt,
          error: lastError.message,
          willRetry: attempt < retryAttempts && !skipRetry,
        });

        if (attempt < retryAttempts && !skipRetry) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retry attempts failed
    this.updateStatus({
      isConnected: false,
      errors: this.status.errors + 1,
    });

    throw lastError || new Error('Request failed after all retry attempts');
  }

  // ============================================================================
  // CONVENIENCE METHODS
  // ============================================================================

  public async get<T>(url: string, options: RequestInit = {}): Promise<T> {
    return this.makeRequest<T>(url, { ...options, method: 'GET' });
  }

  public async post<T>(url: string, data?: any, options: RequestInit = {}): Promise<T> {
    return this.makeRequest<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async put<T>(url: string, data?: any, options: RequestInit = {}): Promise<T> {
    return this.makeRequest<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async delete<T>(url: string, options: RequestInit = {}): Promise<T> {
    return this.makeRequest<T>(url, { ...options, method: 'DELETE' });
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  public destroy(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    this.cache.clear();
    this.connectionListeners = [];
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const connectionManager = new ConnectionManager({
  baseUrl: '', // Will be set by Vite proxy
  timeout: 15000,
  retryAttempts: 3,
  retryDelay: 1000,
  healthCheckInterval: 30000,
  cacheTimeout: 300000, // 5 minutes
});

export default connectionManager;
