/** Minimal observability counters (requests, errors) + Timer with lap() & header() */

const req = new Map<string, number>();
const err = new Map<string, number>();

export function incRequest(route: string) {
  req.set(route, (req.get(route) ?? 0) + 1);
}
export function incError(route: string) {
  err.set(route, (err.get(route) ?? 0) + 1);
}

export class Timer {
  private t0 = process.hrtime.bigint();
  private last = this.t0;

  /** milliseconds since start */
  ms(): number {
    const ns = Number(process.hrtime.bigint() - this.t0);
    return ns / 1e6;
  }

  /** server-timing segment for time since last lap() (or start), then reset lap */
  lap(name = "stage"): string {
    const now = process.hrtime.bigint();
    const ns = Number(now - this.last);
    this.last = now;
    const ms = ns / 1e6;
    return `${name};dur=${ms.toFixed(1)}`;
  }

  /** server-timing segment for total time since start */
  toHeader(name = "handler"): string {
    return `${name};dur=${this.ms().toFixed(1)}`;
  }

  /** alias expected by some routes */
  header(name = "handler"): string {
    return this.toHeader(name);
  }

  /** alias for total */
  total(name = "total"): string {
    return this.toHeader(name);
  }
}

export function metricsText(): string {
  const lines: string[] = [];
  lines.push("# HELP snobify_requests_total Total HTTP requests by route");
  lines.push("# TYPE snobify_requests_total counter");
  for (const [route, n] of req.entries()) {
    const label = route.replace(/"/g,'\\"');
    lines.push(`snobify_requests_total{route="${label}"} ${n}`);
  }

  lines.push("# HELP snobify_errors_total Total HTTP 5xx errors by route");
  lines.push("# TYPE snobify_errors_total counter");
  for (const [route, n] of err.entries()) {
    const label = route.replace(/"/g,'\\"');
    lines.push(`snobify_errors_total{route="${label}"} ${n}`);
  }

  lines.push("# HELP snobify_uptime_seconds Process uptime in seconds");
  lines.push("# TYPE snobify_uptime_seconds gauge");
  lines.push(`snobify_uptime_seconds ${process.uptime().toFixed(1)}`);
  return lines.join("\n") + "\n";
}