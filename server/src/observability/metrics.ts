const reqs = new Map<string, number>();
const errs = new Map<string, number>();
export function incRequest(route: string){ reqs.set(route,(reqs.get(route)||0)+1); }
export function incError(route: string){ errs.set(route,(errs.get(route)||0)+1); }
export function metricsText(){
  const lines:string[] = [];
  lines.push("# HELP snobify_requests_total Total requests by route");
  lines.push("# TYPE snobify_requests_total counter");
  for(const [k,v] of reqs) lines.push(`snobify_requests_total{route="${k}"} ${v}`);
  lines.push("# HELP snobify_errors_total Total errors by route");
  lines.push("# TYPE snobify_errors_total counter");
  for(const [k,v] of errs) lines.push(`snobify_errors_total{route="${k}"} ${v}`);
  return lines.join("\n")+"\n";
}