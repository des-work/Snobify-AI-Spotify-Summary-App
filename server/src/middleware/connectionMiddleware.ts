// ============================================================================
// CONNECTION MIDDLEWARE - Enhanced Server Connection Management
// ============================================================================

import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../observability/logger.js';

export interface ConnectionMetrics {
  totalRequests: number;
  activeConnections: number;
  averageResponseTime: number;
  errorRate: number;
  lastRequestTime: Date;
  connectionHistory: Array<{
    timestamp: Date;
    responseTime: number;
    statusCode: number;
    endpoint: string;
  }>;
}

class ConnectionMiddleware {
  private metrics: ConnectionMetrics = {
    totalRequests: 0,
    activeConnections: 0,
    averageResponseTime: 0,
    errorRate: 0,
    lastRequestTime: new Date(),
    connectionHistory: [],
  };

  private responseTimes: number[] = [];
  private errorCount = 0;
  private readonly maxHistorySize = 1000;

  // ============================================================================
  // REQUEST TRACKING
  // ============================================================================

  public trackRequest(request: FastifyRequest, reply: FastifyReply): void {
    const startTime = Date.now();
    this.metrics.totalRequests++;
    this.metrics.activeConnections++;
    this.metrics.lastRequestTime = new Date();

    // Add response time tracking
    reply.raw.on('finish', () => {
      const responseTime = Date.now() - startTime;
      this.trackResponseTime(responseTime, reply.statusCode, request.url);
      this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1);
    });

    // Add error tracking
    reply.raw.on('error', () => {
      this.errorCount++;
      this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1);
    });

    logger.debug('CONNECTION_MIDDLEWARE', 'Request tracked', {
      url: request.url,
      method: request.method,
      activeConnections: this.metrics.activeConnections,
      totalRequests: this.metrics.totalRequests,
    });
  }

  private trackResponseTime(responseTime: number, statusCode: number, endpoint: string): void {
    this.responseTimes.push(responseTime);
    
    // Keep only last 100 response times for average calculation
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }

    // Update average response time
    this.metrics.averageResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;

    // Track error rate
    if (statusCode >= 400) {
      this.errorCount++;
    }
    this.metrics.errorRate = (this.errorCount / this.metrics.totalRequests) * 100;

    // Add to connection history
    this.metrics.connectionHistory.push({
      timestamp: new Date(),
      responseTime,
      statusCode,
      endpoint,
    });

    // Keep history size manageable
    if (this.metrics.connectionHistory.length > this.maxHistorySize) {
      this.metrics.connectionHistory.shift();
    }

    logger.debug('CONNECTION_MIDDLEWARE', 'Response tracked', {
      responseTime,
      statusCode,
      endpoint,
      averageResponseTime: Math.round(this.metrics.averageResponseTime),
      errorRate: Math.round(this.metrics.errorRate * 100) / 100,
    });
  }

  // ============================================================================
  // METRICS ACCESS
  // ============================================================================

  public getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }

  public getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      averageResponseTime: number;
      errorRate: number;
      activeConnections: number;
      totalRequests: number;
    };
  } {
    const { averageResponseTime, errorRate, activeConnections, totalRequests } = this.metrics;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Determine health status based on metrics
    if (errorRate > 10 || averageResponseTime > 2000) {
      status = 'unhealthy';
    } else if (errorRate > 5 || averageResponseTime > 1000 || activeConnections > 50) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        averageResponseTime: Math.round(averageResponseTime),
        errorRate: Math.round(errorRate * 100) / 100,
        activeConnections,
        totalRequests,
      },
    };
  }

  // ============================================================================
  // CONNECTION LIMITING
  // ============================================================================

  public checkConnectionLimit(): boolean {
    const maxConnections = 100; // Configurable limit
    return this.metrics.activeConnections < maxConnections;
  }

  public getConnectionStats(): {
    activeConnections: number;
    maxConnections: number;
    utilizationPercentage: number;
  } {
    const maxConnections = 100;
    return {
      activeConnections: this.metrics.activeConnections,
      maxConnections,
      utilizationPercentage: Math.round((this.metrics.activeConnections / maxConnections) * 100),
    };
  }

  // ============================================================================
  // PERFORMANCE MONITORING
  // ============================================================================

  public getPerformanceStats(): {
    recentResponseTimes: number[];
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
  } {
    const recentTimes = this.responseTimes.slice(-50); // Last 50 requests
    const sortedTimes = [...recentTimes].sort((a, b) => a - b);
    
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);

    return {
      recentResponseTimes: recentTimes,
      averageResponseTime: Math.round(this.metrics.averageResponseTime),
      p95ResponseTime: sortedTimes[p95Index] || 0,
      p99ResponseTime: sortedTimes[p99Index] || 0,
      errorRate: Math.round(this.metrics.errorRate * 100) / 100,
    };
  }

  // ============================================================================
  // RESET METRICS
  // ============================================================================

  public resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      activeConnections: 0,
      averageResponseTime: 0,
      errorRate: 0,
      lastRequestTime: new Date(),
      connectionHistory: [],
    };
    this.responseTimes = [];
    this.errorCount = 0;

    logger.info('CONNECTION_MIDDLEWARE', 'Metrics reset');
  }
}

// ============================================================================
// MIDDLEWARE FUNCTIONS
// ============================================================================

export const connectionMiddleware = new ConnectionMiddleware();

export async function connectionTrackingMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Check connection limits
  if (!connectionMiddleware.checkConnectionLimit()) {
    logger.warn('CONNECTION_MIDDLEWARE', 'Connection limit exceeded', {
      activeConnections: connectionMiddleware.getConnectionStats().activeConnections,
    });
    
    reply.status(503).send({
      error: {
        message: 'Server overloaded. Please try again later.',
        code: 'ServiceUnavailable',
        reqId: request.id,
      },
    });
    return;
  }

  // Track the request
  connectionMiddleware.trackRequest(request, reply);

  // Add connection headers
  const stats = connectionMiddleware.getConnectionStats();
  reply.header('X-Connection-Active', stats.activeConnections.toString());
  reply.header('X-Connection-Max', stats.maxConnections.toString());
  reply.header('X-Connection-Utilization', `${stats.utilizationPercentage}%`);
}

export async function performanceHeadersMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const performanceStats = connectionMiddleware.getPerformanceStats();
  
  reply.header('X-Performance-Avg-Response-Time', performanceStats.averageResponseTime.toString());
  reply.header('X-Performance-P95-Response-Time', performanceStats.p95ResponseTime.toString());
  reply.header('X-Performance-P99-Response-Time', performanceStats.p99ResponseTime.toString());
  reply.header('X-Performance-Error-Rate', performanceStats.errorRate.toString());
}

export default connectionMiddleware;
