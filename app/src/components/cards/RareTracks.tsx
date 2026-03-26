import { CardProps } from "./types";

function rarityClass(pop: number) {
  if (pop < 15) return "rarity-legendary";
  if (pop < 30) return "rarity-underground";
  if (pop < 50) return "rarity-niche";
  return "rarity-mainstream";
}

function rarityLabel(pop: number) {
  if (pop < 15) return "Legendary";
  if (pop < 30) return "Underground";
  if (pop < 50) return "Niche";
  return "Mainstream";
}

export default function RareTracks({ stats }: CardProps) {
  const tracks = stats.rareTracks.slice(0, 15);
  const avgPop = tracks.length > 0
    ? Math.round(tracks.reduce((s, t) => s + t.pop, 0) / tracks.length)
    : 0;

  return (
    <div className="card" data-card="rare-tracks">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="title">Rarest Finds</div>
        <div className="muted">
          {tracks.length} tracks &bull; avg popularity {avgPop}/100
        </div>
      </div>

      <div style={{ maxHeight: 380, overflowY: "auto" }}>
        {tracks.map((track, i) => (
          <div
            key={i}
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  color: "var(--muted)",
                  width: 24,
                  flexShrink: 0,
                  textAlign: "right",
                }}
              >
                {i + 1}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {track.name}
                </div>
                <div style={{ color: "var(--muted)", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {track.artist}
                </div>
              </div>
            </div>
            <div className={`rarity-score ${rarityClass(track.pop)}`} style={{ flexShrink: 0 }}>
              {track.pop} &bull; {rarityLabel(track.pop)}
            </div>
          </div>
        ))}
        {tracks.length === 0 && (
          <p style={{ color: "var(--muted)", textAlign: "center", padding: 24 }}>
            No rare tracks found in your library.
          </p>
        )}
      </div>
    </div>
  );
}
