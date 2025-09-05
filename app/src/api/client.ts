import type { StatsResponse } from "../types";
import { logger } from "../utils/debugLogger";

interface ApiError {
  error: {
    message: string;
    code?: string;
    reqId?: string;
  };
}

class SnobifyApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public reqId?: string,
    public status?: number,
    public url?: string
  ) {
    super(message);
    this.name = 'SnobifyApiError';
  }
}

async function handleApiResponse<T>(response: Response, url: string): Promise<T> {
  const startTime = performance.now();
  
  logger.debug('API_REQUEST', `Making request to ${url}`, {
    method: 'GET',
    url,
    timestamp: new Date().toISOString()
  });

  if (!response.ok) {
    let errorData: ApiError;
    try {
      errorData = await response.json();
    } catch {
      const error = new SnobifyApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        'HTTP_ERROR',
        undefined,
        response.status,
        url
      );
      
      logger.error('API_ERROR', `HTTP error for ${url}`, {
        status: response.status,
        statusText: response.statusText,
        url,
        duration: performance.now() - startTime
      });
      
      throw error;
    }
    
    const error = new SnobifyApiError(
      errorData.error.message,
      errorData.error.code,
      errorData.error.reqId,
      response.status,
      url
    );
    
    logger.error('API_ERROR', `API error for ${url}`, {
      error: errorData.error,
      status: response.status,
      url,
      duration: performance.now() - startTime
    });
    
    throw error;
  }
  
  const data = await response.json();
  const duration = performance.now() - startTime;
  
  logger.info('API_SUCCESS', `Successfully fetched ${url}`, {
    url,
    duration: Math.round(duration),
    dataSize: JSON.stringify(data).length
  });
  
  return data;
}

export async function fetchStats(profile = "default"): Promise<{
  data: StatsResponse;
  timings?: string;
  etag?: string;
  xhash?: string;
}> {
  const t0 = performance.now();
  const url = `/api/stats?profile=${encodeURIComponent(profile)}`;
  
  try {
    logger.debug('API_STATS', `Fetching stats for profile: ${profile}`);
    
    const res = await fetch(url);
    const timings = res.headers.get("server-timing") ?? undefined;
    const etag = res.headers.get("etag") ?? undefined;
    const xhash = res.headers.get("x-snobify-hash") ?? undefined;
    
    const data: StatsResponse = await handleApiResponse<StatsResponse>(res, url);
    (data as any)._latencyMs = Math.round(performance.now() - t0);
    
    logger.info('API_STATS', `Stats fetched successfully`, {
      profile,
      trackCount: data.stats?.tracks?.length || 0,
      latency: (data as any)._latencyMs
    });
    
    return { data, timings, etag, xhash };
  } catch (error) {
    logger.error('API_STATS', `Failed to fetch stats for profile: ${profile}`, {
      error: error instanceof Error ? error.message : String(error),
      profile,
      duration: performance.now() - t0
    });
    throw error;
  }
}

export async function fetchDebug(profile = "default"): Promise<any> {
  const url = `/api/debug?profile=${encodeURIComponent(profile)}`;
  
  try {
    logger.debug('API_DEBUG', `Fetching debug info for profile: ${profile}`);
    
    const res = await fetch(url);
    const data = await handleApiResponse(res, url);
    
    logger.info('API_DEBUG', `Debug info fetched successfully`, {
      profile,
      dataKeys: Object.keys(data || {})
    });
    
    return data;
  } catch (error) {
    logger.error('API_DEBUG', `Failed to fetch debug info for profile: ${profile}`, {
      error: error instanceof Error ? error.message : String(error),
      profile
    });
    throw error;
  }
}

export { SnobifyApiError };