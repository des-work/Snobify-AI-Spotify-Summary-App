export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: ServiceStatus;
    ml: ServiceStatus;
    api: ServiceStatus;
    dependencies: ServiceStatus;
  };
  metrics: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: number;
    activeConnections: number;
  };
  errors: Array<{
    timestamp: string;
    service: string;
    error: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
}

export interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  lastCheck: string;
  details?: string;
}

export class HealthChecker {
  private startTime: number;
  private errors: Array<{
    timestamp: string;
    service: string;
    error: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }> = [];
  private activeConnections: number = 0;

  constructor() {
    this.startTime = Date.now();
    console.log('Health checker initialized');
  }

  async checkHealth(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    const uptime = Date.now() - this.startTime;

    try {
      // Check all services in parallel
      const [databaseStatus, mlStatus, apiStatus, dependenciesStatus] = await Promise.all([
        this.checkDatabase(),
        this.checkMLServices(),
        this.checkAPI(),
        this.checkDependencies()
      ]);

      // Calculate overall status
      const serviceStatuses = [databaseStatus, mlStatus, apiStatus, dependenciesStatus];
      const overallStatus = this.calculateOverallStatus(serviceStatuses);

      // Get system metrics
      const metrics = this.getSystemMetrics();

      return {
        status: overallStatus,
        timestamp,
        uptime,
        version: process.env.npm_package_version || '0.2.0',
        services: {
          database: databaseStatus,
          ml: mlStatus,
          api: apiStatus,
          dependencies: dependenciesStatus
        },
        metrics,
        errors: this.errors.slice(-10) // Keep last 10 errors
      };
    } catch (error) {
      this.logError('health-checker', `Health check failed: ${error}`, 'critical');
      return {
        status: 'unhealthy',
        timestamp,
        uptime,
        version: process.env.npm_package_version || '0.2.0',
        services: {
          database: { status: 'down', lastCheck: timestamp, details: 'Health check failed' },
          ml: { status: 'down', lastCheck: timestamp, details: 'Health check failed' },
          api: { status: 'down', lastCheck: timestamp, details: 'Health check failed' },
          dependencies: { status: 'down', lastCheck: timestamp, details: 'Health check failed' }
        },
        metrics: this.getSystemMetrics(),
        errors: this.errors.slice(-10)
      };
    }
  }

  private async checkDatabase(): Promise<ServiceStatus> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      // Check if data files exist and are accessible
      const fs = await import('fs');
      const path = await import('path');
      
      const dataPath = path.join(process.cwd(), '..', 'Music data');
      const profilesPath = path.join(process.cwd(), '..', 'profiles');
      
      const dataExists = fs.existsSync(dataPath);
      const profilesExist = fs.existsSync(profilesPath);
      
      if (dataExists && profilesExist) {
        return {
          status: 'up',
          responseTime: Date.now() - startTime,
          lastCheck: timestamp,
          details: 'Data files accessible'
        };
      } else {
        return {
          status: 'degraded',
          responseTime: Date.now() - startTime,
          lastCheck: timestamp,
          details: 'Some data files missing'
        };
      }
    } catch (error) {
      this.logError('database', `Database check failed: ${error}`, 'high');
      return {
        status: 'down',
        lastCheck: timestamp,
        details: `Error: ${error}`
      };
    }
  }

  private async checkMLServices(): Promise<ServiceStatus> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      // Check if ML modules can be imported
      const mlModules = [
        './ml/moodPredictor.js',
        './ml/genreClassifier.js',
        './ml/artistClusterer.js',
        './ml/recommendationEngine.js'
      ];

      let loadedModules = 0;
      for (const module of mlModules) {
        try {
          await import(module);
          loadedModules++;
        } catch (error) {
          console.warn(`Failed to load ML module ${module}:`, error);
        }
      }

      const successRate = loadedModules / mlModules.length;
      
      if (successRate >= 0.8) {
        return {
          status: 'up',
          responseTime: Date.now() - startTime,
          lastCheck: timestamp,
          details: `${loadedModules}/${mlModules.length} ML modules loaded`
        };
      } else if (successRate >= 0.5) {
        return {
          status: 'degraded',
          responseTime: Date.now() - startTime,
          lastCheck: timestamp,
          details: `${loadedModules}/${mlModules.length} ML modules loaded`
        };
      } else {
        return {
          status: 'down',
          responseTime: Date.now() - startTime,
          lastCheck: timestamp,
          details: `Only ${loadedModules}/${mlModules.length} ML modules loaded`
        };
      }
    } catch (error) {
      this.logError('ml-services', `ML services check failed: ${error}`, 'high');
      return {
        status: 'down',
        lastCheck: timestamp,
        details: `Error: ${error}`
      };
    }
  }

  private async checkAPI(): Promise<ServiceStatus> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      // Check if API endpoints are responding
      const endpoints = [
        '/api/stats',
        '/api/mood-prediction',
        '/api/genre-classification'
      ];

      // For now, just check if the server is running
      return {
        status: 'up',
        responseTime: Date.now() - startTime,
        lastCheck: timestamp,
        details: 'API server running'
      };
    } catch (error) {
      this.logError('api', `API check failed: ${error}`, 'high');
      return {
        status: 'down',
        lastCheck: timestamp,
        details: `Error: ${error}`
      };
    }
  }

  private async checkDependencies(): Promise<ServiceStatus> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      // Check critical dependencies
      const dependencies = [
        'fastify',
        'csv-parse',
        'pino',
        'zod'
      ];

      let loadedDeps = 0;
      for (const dep of dependencies) {
        try {
          await import(dep);
          loadedDeps++;
        } catch (error) {
          console.warn(`Failed to load dependency ${dep}:`, error);
        }
      }

      const successRate = loadedDeps / dependencies.length;
      
      if (successRate >= 0.8) {
        return {
          status: 'up',
          responseTime: Date.now() - startTime,
          lastCheck: timestamp,
          details: `${loadedDeps}/${dependencies.length} dependencies loaded`
        };
      } else {
        return {
          status: 'degraded',
          responseTime: Date.now() - startTime,
          lastCheck: timestamp,
          details: `${loadedDeps}/${dependencies.length} dependencies loaded`
        };
      }
    } catch (error) {
      this.logError('dependencies', `Dependencies check failed: ${error}`, 'medium');
      return {
        status: 'down',
        lastCheck: timestamp,
        details: `Error: ${error}`
      };
    }
  }

  private calculateOverallStatus(serviceStatuses: ServiceStatus[]): 'healthy' | 'degraded' | 'unhealthy' {
    const statusCounts = serviceStatuses.reduce((counts, status) => {
      counts[status.status] = (counts[status.status] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    if (statusCounts.down > 0) {
      return 'unhealthy';
    } else if (statusCounts.degraded > 0) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  private getSystemMetrics() {
    const memoryUsage = process.memoryUsage();
    
    return {
      memoryUsage,
      cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
      activeConnections: this.activeConnections
    };
  }

  public logError(service: string, error: string, severity: 'low' | 'medium' | 'high' | 'critical') {
    this.errors.push({
      timestamp: new Date().toISOString(),
      service,
      error,
      severity
    });

    // Keep only last 100 errors
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }

    console.error(`[${severity.toUpperCase()}] ${service}: ${error}`);
  }

  public incrementConnections() {
    this.activeConnections++;
  }

  public decrementConnections() {
    this.activeConnections = Math.max(0, this.activeConnections - 1);
  }
}
