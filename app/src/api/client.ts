import type { StatsResponse } from "../types";
import { logger } from "../utils/debugLogger";
import connectionManager from "./connectionManager";


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
    
    // Use connection manager for robust request handling
    const data: StatsResponse = await connectionManager.get<StatsResponse>(url);
    
    // Get additional headers from the last response (if available)
    const timings = undefined; // Will be handled by connection manager
    const etag = undefined; // Will be handled by connection manager
    const xhash = undefined; // Will be handled by connection manager
    
    (data as any)._latencyMs = Math.round(performance.now() - t0);
    
    logger.info('API_STATS', `Stats fetched successfully`, {
      profile,
      rows: data.stats?.meta?.rows || 0,
      latency: (data as any)._latencyMs,
      connectionStatus: connectionManager.getStatus()
    });
    
    return { data, timings, etag, xhash };
  } catch (error) {
    logger.error('API_STATS', `Failed to fetch stats for profile: ${profile}`, {
      error: error instanceof Error ? error.message : String(error),
      profile,
      duration: performance.now() - t0,
      connectionStatus: connectionManager.getStatus()
    });
    throw error;
  }
}

export async function fetchDebug(profile = "default"): Promise<any> {
  const url = `/api/debug?profile=${encodeURIComponent(profile)}`;
  
  try {
    logger.debug('API_DEBUG', `Fetching debug info for profile: ${profile}`);
    
    // Use connection manager for robust request handling
    const data = await connectionManager.get(url);
    
    logger.info('API_DEBUG', `Debug info fetched successfully`, {
      profile,
      dataKeys: Object.keys(data || {}),
      connectionStatus: connectionManager.getStatus()
    });
    
    return data;
  } catch (error) {
    logger.error('API_DEBUG', `Failed to fetch debug info for profile: ${profile}`, {
      error: error instanceof Error ? error.message : String(error),
      profile,
      connectionStatus: connectionManager.getStatus()
    });
    throw error;
  }
}

// ============================================================================
// NEW ENHANCED API FUNCTIONS
// ============================================================================

export async function fetchMLAnalysis(profile = "default"): Promise<any> {
  const url = `/api/ml-analysis?profile=${encodeURIComponent(profile)}`;
  
  try {
    logger.debug('API_ML_ANALYSIS', `Fetching ML analysis for profile: ${profile}`);
    
    const data = await connectionManager.get(url);
    
    logger.info('API_ML_ANALYSIS', `ML analysis fetched successfully`, {
      profile,
      dataKeys: Object.keys(data || {}),
      connectionStatus: connectionManager.getStatus()
    });
    
    return data;
  } catch (error) {
    logger.error('API_ML_ANALYSIS', `Failed to fetch ML analysis for profile: ${profile}`, {
      error: error instanceof Error ? error.message : String(error),
      profile,
      connectionStatus: connectionManager.getStatus()
    });
    throw error;
  }
}

export async function fetchMoodPrediction(profile = "default"): Promise<any> {
  const url = `/api/mood-prediction?profile=${encodeURIComponent(profile)}`;
  
  try {
    logger.debug('API_MOOD_PREDICTION', `Fetching mood prediction for profile: ${profile}`);
    
    const data = await connectionManager.get(url);
    
    logger.info('API_MOOD_PREDICTION', `Mood prediction fetched successfully`, {
      profile,
      dataKeys: Object.keys(data || {}),
      connectionStatus: connectionManager.getStatus()
    });
    
    return data;
  } catch (error) {
    logger.error('API_MOOD_PREDICTION', `Failed to fetch mood prediction for profile: ${profile}`, {
      error: error instanceof Error ? error.message : String(error),
      profile,
      connectionStatus: connectionManager.getStatus()
    });
    throw error;
  }
}

export async function trainMoodModel(profile = "default"): Promise<any> {
  const url = `/api/mood-training?profile=${encodeURIComponent(profile)}`;
  
  try {
    logger.debug('API_MOOD_TRAINING', `Training mood model for profile: ${profile}`);
    
    const data = await connectionManager.post(url);
    
    logger.info('API_MOOD_TRAINING', `Mood model training completed`, {
      profile,
      dataKeys: Object.keys(data || {}),
      connectionStatus: connectionManager.getStatus()
    });
    
    return data;
  } catch (error) {
    logger.error('API_MOOD_TRAINING', `Failed to train mood model for profile: ${profile}`, {
      error: error instanceof Error ? error.message : String(error),
      profile,
      connectionStatus: connectionManager.getStatus()
    });
    throw error;
  }
}

export { SnobifyApiError };