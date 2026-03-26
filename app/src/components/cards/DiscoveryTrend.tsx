import { CardProps } from "./types";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function DiscoveryTrend({ stats }: CardProps) {
  const trend = stats.discoveryTrend ?? [];
  // Show last 18 months of discovery data
  const data = trend.slice(-18).map(d => ({
    month: d.month.slice(2), // "2024-03" → "24-03"
    discovered: d.count,
  }));

  const totalDiscovered = trend.reduce((s, d) => s + d.count, 0);
  const peakDiscovery = trend.reduce(
    (best, d) => (d.count > best.count ? d : best),
    { month: "", count: 0 }
  );
  const avgPerMonth = trend.length > 0
    ? Math.round(totalDiscovered / trend.length)
    : 0;

  return (
    <div className="card" data-card="discovery">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="title">Discovery Trend</div>
        <div className="muted">
          {totalDiscovered.toLocaleString()} new tracks &bull; ~{avgPerMonth}/mo avg
        </div>
      </div>
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 24 }}>
            <defs>
              <linearGradient id="discoveryGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f093fb" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#f5576c" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              interval={Math.max(0, Math.floor(data.length / 8))}
              tick={{ fontSize: 10, fill: "#9aa0a6" }}
              angle={-45}
              textAnchor="end"
              height={40}
            />
            <YAxis tick={{ fontSize: 10, fill: "#9aa0a6" }} />
            <Tooltip
              formatter={(value: number) => [value.toLocaleString(), "New Tracks"]}
              labelFormatter={(label) => `Month: ${label}`}
              contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }}
            />
            <Area
              type="monotone"
              dataKey="discovered"
              stroke="#f093fb"
              strokeWidth={2}
              fill="url(#discoveryGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {peakDiscovery.month && (
        <div className="muted" style={{ textAlign: "center", marginTop: 8 }}>
          Peak discovery: {peakDiscovery.month} with {peakDiscovery.count.toLocaleString()} new tracks
        </div>
      )}
    </div>
  );
}
