// ============================================================================
// DATA FLOW MANAGER - Intelligent Data Management and Caching
// ============================================================================

import { logger } from "../utils/debugLogger";
import connectionManager from "../api/connectionManager";

export interface DataCache<T> {
  data: T;
  timestamp: Date;
  expiresAt: Date;
  version: string;
  source: 'api' | 'cache' | 'fallback';
}

export interface DataFlowConfig {
  cacheTimeout: number;
  retryAttempts: number;
  fallbackData?: any;
  enableOfflineMode: boolean;
  dataVersioning: boolean;
}

class DataFlowManager {
  private cache: Map<string, DataCache<any>> = new Map();
  private config: DataFlowConfig;
  private dataVersion = '1.0.0';

  constructor(config: Partial<DataFlowConfig> = {}) {
    this.config = {
      cacheTimeout: config.cacheTimeout || 300000, // 5 minutes
      retryAttempts: config.retryAttempts || 3,
      fallbackData: config.fallbackData,
      enableOfflineMode: config.enableOfflineMode || true,
      dataVersioning: config.dataVersioning || true,
    };

    // Listen for connection status changes
    connectionManager.addConnectionListener((status) => {
      if (!status.isConnected && this.config.enableOfflineMode) {
        this.enableOfflineMode();
      }
    });
  }

  // ============================================================================
  // DATA FETCHING WITH INTELLIGENT CACHING
  // ============================================================================

  public async fetchData<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: {
      forceRefresh?: boolean;
      cacheTimeout?: number;
      fallbackData?: T;
    } = {}
  ): Promise<T> {
    const {
      forceRefresh = false,
      cacheTimeout = this.config.cacheTimeout,
      fallbackData = this.config.fallbackData,
    } = options;

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedData = this.getCachedData<T>(key);
      if (cachedData) {
        logger.debug('DATA_FLOW_MANAGER', 'Cache hit', { key, source: cachedData.source });
        return cachedData.data;
      }
    }

    // Try to fetch fresh data
    try {
      const data = await fetcher();
      this.setCachedData(key, data, cacheTimeout);
      
      logger.info('DATA_FLOW_MANAGER', 'Data fetched successfully', {
        key,
        source: 'api',
        dataSize: JSON.stringify(data).length,
      });
      
      return data;
    } catch (error) {
      logger.warn('DATA_FLOW_MANAGER', 'Failed to fetch data', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });

      // Try fallback data
      if (fallbackData) {
        logger.info('DATA_FLOW_MANAGER', 'Using fallback data', { key });
        return fallbackData;
      }

      // Try cached data even if expired
      const expiredCache = this.getCachedData<T>(key, true);
      if (expiredCache) {
        logger.info('DATA_FLOW_MANAGER', 'Using expired cache as fallback', { key });
        return expiredCache.data;
      }

      throw error;
    }
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  private getCachedData<T>(key: string, allowExpired = false): DataCache<T> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (!allowExpired && new Date() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  private setCachedData<T>(key: string, data: T, timeout: number): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + timeout);

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
      version: this.dataVersion,
      source: 'api',
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
  // OFFLINE MODE MANAGEMENT
  // ============================================================================

  private enableOfflineMode(): void {
    logger.info('DATA_FLOW_MANAGER', 'Enabling offline mode');
    // Could implement local storage persistence here
  }

  public getOfflineData<T>(key: string): T | null {
    // Try to get data from localStorage as fallback
    try {
      const stored = localStorage.getItem(`snobify_cache_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.version === this.dataVersion) {
          return parsed.data;
        }
      }
    } catch (error) {
      logger.warn('DATA_FLOW_MANAGER', 'Failed to read offline data', { key, error });
    }
    return null;
  }

  public setOfflineData<T>(key: string, data: T): void {
    try {
      const cacheEntry = {
        data,
        timestamp: new Date().toISOString(),
        version: this.dataVersion,
      };
      localStorage.setItem(`snobify_cache_${key}`, JSON.stringify(cacheEntry));
    } catch (error) {
      logger.warn('DATA_FLOW_MANAGER', 'Failed to store offline data', { key, error });
    }
  }

  // ============================================================================
  // DATA VERSIONING
  // ============================================================================

  public updateDataVersion(version: string): void {
    this.dataVersion = version;
    logger.info('DATA_FLOW_MANAGER', 'Data version updated', { version });
  }

  public getDataVersion(): string {
    return this.dataVersion;
  }

  // ============================================================================
  // CACHE STATISTICS
  // ============================================================================

  public getCacheStats(): {
    totalEntries: number;
    expiredEntries: number;
    memoryUsage: number;
    hitRate: number;
  } {
    const now = new Date();
    let expiredEntries = 0;
    let memoryUsage = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredEntries++;
      }
      memoryUsage += JSON.stringify(entry.data).length;
    }

    return {
      totalEntries: this.cache.size,
      expiredEntries,
      memoryUsage,
      hitRate: 0, // Would need to track hits/misses
    };
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  public clearCache(): void {
    this.cache.clear();
    logger.info('DATA_FLOW_MANAGER', 'Cache cleared');
  }

  public clearExpiredCache(): void {
    const now = new Date();
    let cleared = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleared++;
      }
    }
    
    logger.info('DATA_FLOW_MANAGER', 'Expired cache entries cleared', { cleared });
  }

  public invalidateCache(key: string): void {
    this.cache.delete(key);
    logger.info('DATA_FLOW_MANAGER', 'Cache entry invalidated', { key });
  }

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  public updateConfig(newConfig: Partial<DataFlowConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('DATA_FLOW_MANAGER', 'Configuration updated', newConfig);
  }

  public getConfig(): DataFlowConfig {
    return { ...this.config };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const dataFlowManager = new DataFlowManager({
  cacheTimeout: 300000, // 5 minutes
  retryAttempts: 3,
  enableOfflineMode: true,
  dataVersioning: true,
});

export default dataFlowManager;
