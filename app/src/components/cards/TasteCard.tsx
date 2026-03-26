import { CardProps } from "./types";

function pct(n: number) { return Math.round(n * 100); }

function meterBar(label: string, value: number, color: string) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{label}</span>
        <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{pct(value)}%</span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${pct(value)}%`, background: color }}
        />
      </div>
    </div>
  );
}

function describeTaste(t: { avgValence: number; avgEnergy: number; avgDanceability: number; acousticBias: number; instrumentalBias: number }) {
  const tags: string[] = [];
  if (t.avgValence > 0.6) tags.push("upbeat");
  else if (t.avgValence < 0.35) tags.push("melancholic");
  if (t.avgEnergy > 0.7) tags.push("high-energy");
  else if (t.avgEnergy < 0.35) tags.push("mellow");
  if (t.avgDanceability > 0.65) tags.push("groovy");
  if (t.acousticBias > 0.5) tags.push("acoustic-leaning");
  if (t.instrumentalBias > 0.4) tags.push("instrumental-heavy");
  return tags.length > 0 ? tags.join(", ") : "balanced";
}

export default function TasteCard({ stats }: CardProps) {
  const t = stats.taste;
  const summary = describeTaste(t);

  return (
    <div className="card" data-card="taste">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="title">Taste Profile</div>
        <div className="muted" style={{ textTransform: "capitalize" }}>{summary}</div>
      </div>

      {meterBar("Danceability", t.avgDanceability, "#667eea")}
      {meterBar("Energy", t.avgEnergy, "#f5576c")}
      {meterBar("Positivity", t.avgValence, "#10b981")}
      {meterBar("Acousticness", t.acousticBias, "#f59e0b")}
      {meterBar("Instrumentalness", t.instrumentalBias, "#8b5cf6")}

      <div style={{
        marginTop: 16,
        padding: "12px 16px",
        background: "rgba(102, 126, 234, 0.08)",
        borderRadius: 12,
        fontSize: "0.85rem",
        color: "var(--muted)",
      }}>
        Weighted averages across your unique tracks, play-count weighted for accuracy.
      </div>
    </div>
  );
}
