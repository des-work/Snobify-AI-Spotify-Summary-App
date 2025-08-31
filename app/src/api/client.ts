import type { StatsResponse } from "../types";
export async function fetchStats(profile = "default"){
  const t0 = performance.now();
  const res = await fetch(`/api/stats?profile=${encodeURIComponent(profile)}`);
  const timings = res.headers.get("server-timing") ?? undefined;
  const etag = res.headers.get("etag") ?? undefined;
  const xhash = res.headers.get("x-snobify-hash") ?? undefined;
  const data: StatsResponse = await res.json();
  (data as any)._latencyMs = Math.round(performance.now() - t0);
  return { data, timings, etag, xhash };
}
export async function fetchDebug(profile="default"){
  const res = await fetch(`/api/debug?profile=${encodeURIComponent(profile)}`);
  return await res.json();
}