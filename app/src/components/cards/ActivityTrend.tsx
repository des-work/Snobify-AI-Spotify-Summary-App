import { CardProps } from "./types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function ActivityTrend({ stats }: CardProps) {
  const trend = stats.activityTrend ?? [];
  const data = trend.slice(-18).map(d => ({
    month: d.month.slice(2), // "2024-03" → "24-03"
    plays: d.count,
  }));

  const totalPlays = trend.reduce((s, d) => s + d.count, 0);
  const peakMonth = trend.reduce(
    (best, d) => (d.count > best.count ? d : best),
    { month: "", count: 0 }
  );

  return (
    <div className="card" data-card="activity">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="title">Activity Trend</div>
        <div className="muted">
          {totalPlays.toLocaleString()} plays &bull; peak {peakMonth.month} ({peakMonth.count.toLocaleString()})
        </div>
      </div>
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 24 }}>
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
              formatter={(value: number) => [value.toLocaleString(), "Plays"]}
              labelFormatter={(label) => `Month: ${label}`}
              contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }}
            />
            <Bar dataKey="plays" fill="#667eea" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
