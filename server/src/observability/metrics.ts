// ============================================================================
// METRICS - Simple Implementation
// ============================================================================

interface Metrics {
  requests: { [key: string]: number };
  errors: { [key: string]: number };
  timers: { [key: string]: number };
}

const metrics: Metrics = {
  requests: {},
  errors: {},
  timers: {}
};

export function incRequest(endpoint: string): void {
  metrics.requests[endpoint] = (metrics.requests[endpoint] || 0) + 1;
}

export function incError(endpoint: string): void {
  metrics.errors[endpoint] = (metrics.errors[endpoint] || 0) + 1;
}

export function metricsText(): string {
  let text = '# HELP snobify_requests_total Total number of requests\n';
  text += '# TYPE snobify_requests_total counter\n';
  
  for (const [endpoint, count] of Object.entries(metrics.requests)) {
    text += `snobify_requests_total{endpoint="${endpoint}"} ${count}\n`;
  }
  
  text += '\n# HELP snobify_errors_total Total number of errors\n';
  text += '# TYPE snobify_errors_total counter\n';
  
  for (const [endpoint, count] of Object.entries(metrics.errors)) {
    text += `snobify_errors_total{endpoint="${endpoint}"} ${count}\n`;
  }
  
  return text;
}

export class Timer {
  private startTime: number;
  private laps: { [key: string]: number } = {};

  constructor() {
    this.startTime = performance.now();
  }

  lap(label: string): void {
    this.laps[label] = performance.now() - this.startTime;
  }

  total(label: string): string {
    return `${label};dur=${performance.now() - this.startTime}`;
  }

  header(): string {
    const entries = Object.entries(this.laps).map(([key, value]) => `${key};dur=${value}`);
    return entries.join(', ');
  }
}