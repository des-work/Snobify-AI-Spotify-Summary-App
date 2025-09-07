// ============================================================================
// DATA LOADER HOOK - Enhanced Data Loading with Debugging
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { fetchStats, fetchDebug } from '../api/client';
import { logger } from '../utils/debugLogger';
import dataFlowManager from '../data/dataFlowManager';

interface DataLoaderState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetch: Date | null;
  retryCount: number;
  debugInfo: {
    fetchAttempts: number;
    cacheHits: number;
    networkErrors: number;
    dataSize: number;
    loadTime: number;
  };
}

interface DataLoaderOptions {
  autoFetch?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  cacheTimeout?: number;
  enableDebug?: boolean;
}

export function useDataLoader<T>(
  dataKey: string,
  fetcher: () => Promise<T>,
  options: DataLoaderOptions = {}
) {
  const {
    autoFetch = true,
    retryAttempts = 3,
    retryDelay = 1000,
    cacheTimeout = 300000,
    enableDebug = true,
  } = options;

  const [state, setState] = useState<DataLoaderState<T>>({
    data: null,
    loading: false,
    error: null,
    lastFetch: null,
    retryCount: 0,
    debugInfo: {
      fetchAttempts: 0,
      cacheHits: 0,
      networkErrors: 0,
      dataSize: 0,
      loadTime: 0,
    },
  });

  const loadData = useCallback(async (forceRefresh = false) => {
    if (state.loading) return;

    const startTime = performance.now();
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      if (enableDebug) {
        logger.debug('DATA_LOADER', `Loading data for key: ${dataKey}`, {
          forceRefresh,
          retryCount: state.retryCount,
        });
      }

      const data = await dataFlowManager.fetchData(
        dataKey,
        fetcher,
        {
          forceRefresh,
          cacheTimeout,
          fallbackData: null,
        }
      );

      const loadTime = performance.now() - startTime;
      const dataSize = JSON.stringify(data).length;

      setState(prev => ({
        ...prev,
        data,
        loading: false,
        error: null,
        lastFetch: new Date(),
        retryCount: 0,
        debugInfo: {
          ...prev.debugInfo,
          fetchAttempts: prev.debugInfo.fetchAttempts + 1,
          dataSize,
          loadTime: Math.round(loadTime),
        },
      }));

      if (enableDebug) {
        logger.info('DATA_LOADER', `Data loaded successfully`, {
          key: dataKey,
          loadTime: Math.round(loadTime),
          dataSize,
          cacheStats: dataFlowManager.getCacheStats(),
        });
      }

    } catch (error) {
      const loadTime = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        retryCount: prev.retryCount + 1,
        debugInfo: {
          ...prev.debugInfo,
          fetchAttempts: prev.debugInfo.fetchAttempts + 1,
          networkErrors: prev.debugInfo.networkErrors + 1,
          loadTime: Math.round(loadTime),
        },
      }));

      if (enableDebug) {
        logger.error('DATA_LOADER', `Failed to load data`, {
          key: dataKey,
          error: errorMessage,
          retryCount: state.retryCount + 1,
          loadTime: Math.round(loadTime),
        });
      }

      // Auto-retry if we haven't exceeded retry attempts
      if (state.retryCount < retryAttempts) {
        setTimeout(() => {
          loadData(forceRefresh);
        }, retryDelay * Math.pow(2, state.retryCount)); // Exponential backoff
      }
    }
  }, [dataKey, fetcher, state.loading, state.retryCount, cacheTimeout, enableDebug, retryAttempts, retryDelay]);

  const retry = useCallback(() => {
    loadData(true);
  }, [loadData]);

  const refresh = useCallback(() => {
    loadData(true);
  }, [loadData]);

  useEffect(() => {
    if (autoFetch) {
      loadData();
    }
  }, [autoFetch, loadData]);

  return {
    ...state,
    retry,
    refresh,
    loadData,
  };
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

export function useStatsData(profile = 'default') {
  return useDataLoader(
    `stats_${profile}`,
    () => fetchStats(profile).then(result => result.data),
    {
      autoFetch: true,
      retryAttempts: 3,
      cacheTimeout: 300000, // 5 minutes
      enableDebug: true,
    }
  );
}

export function useDebugData(profile = 'default') {
  return useDataLoader(
    `debug_${profile}`,
    () => fetchDebug(profile),
    {
      autoFetch: false, // Manual fetch only
      retryAttempts: 2,
      cacheTimeout: 60000, // 1 minute
      enableDebug: true,
    }
  );
}
