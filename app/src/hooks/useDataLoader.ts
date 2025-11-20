// ============================================================================
// DATA LOADER HOOK - Enhanced Data Loading with Debugging
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
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

  const loadingRef = useRef(false);
  // Keep track of retry count in ref to avoid dependency cycles
  const retryCountRef = useRef(0);

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

  // Reset refs when dataKey changes
  useEffect(() => {
    loadingRef.current = false;
    retryCountRef.current = 0;
  }, [dataKey]);

  const loadData = useCallback(async (forceRefresh = false) => {
    if (loadingRef.current) return;

    const startTime = performance.now();
    loadingRef.current = true;
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      if (enableDebug) {
        logger.debug('DATA_LOADER', `Loading data for key: ${dataKey}`, {
          forceRefresh,
          retryCount: retryCountRef.current,
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

      loadingRef.current = false;
      retryCountRef.current = 0;

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

      loadingRef.current = false;
      retryCountRef.current += 1;

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
          retryCount: retryCountRef.current,
          loadTime: Math.round(loadTime),
        });
      }

      // Auto-retry if we haven't exceeded retry attempts
      if (retryCountRef.current < retryAttempts) {
        setTimeout(() => {
          loadData(forceRefresh);
        }, retryDelay * Math.pow(2, retryCountRef.current)); // Exponential backoff
      }
    }
  }, [dataKey, fetcher, cacheTimeout, enableDebug, retryAttempts, retryDelay]);

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
    // We intentionally omit loadData from dependencies to prevent infinite loops
    // We only want to re-fetch when dataKey or autoFetch changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey, autoFetch]);

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
    () => fetchStats(profile).then(result => result.data.stats),
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
