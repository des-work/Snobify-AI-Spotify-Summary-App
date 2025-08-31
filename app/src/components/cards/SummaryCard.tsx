import { CardProps } from "./types";

function pct(n:number){ return Math.round(n*100); }

function buildSummary(stats:any, mode:"PG13"|"R", useStats:boolean){
  const g = stats.topUniqueGenres?.[0]?.genre?.split(/[|,]/)[0] ?? "something suspicious";
  const t = stats.taste;
  const r = stats.playlistRater;
  const rare = stats.rareTracks?.[0]?.name ?? null;
  const lines:string[] = [];

  if(mode === "R"){
    lines.push(`Your library swerves like a late-night Uber—${g} up front, detours everywhere else.`);
    if(useStats) lines.push(`You drift ${pct(t.avgDanceability)}% dance, ${pct(t.avgEnergy)}% energy, and somehow keep it ${pct(t.acousticBias)}% acoustic. Chaotic? Sure. Boring? Never.`);
    lines.push(`Cohesion at ${r.cohesion} means you actually have a theme—against all odds.`);
    if(rare) lines.push(`Deep cut flex: “${rare}”. That’s a wink only the real ones catch.`);
  } else {
    lines.push(`Big picture: you orbit ${g} with confident side-quests.`);
    if(useStats) lines.push(`Taste profile: dance ${pct(t.avgDanceability)}%, energy ${pct(t.avgEnergy)}%, acoustic ${pct(t.acousticBias)}%.`);
    lines.push(`Cohesion ${r.cohesion} keeps things focused while variety ${r.variety} sprinkles discovery.`);
    if(rare) lines.push(`Bonus deep cut: “${rare}”. Nice pull.`);
  }
  lines.push(`Overall score ${r.overall}. Creativity ${r.creativity}, rarity ${r.rarityScore}. Keep being weird in public.`);

  return lines.join(" ");
}

export default function SummaryCard({ stats }: CardProps & { mode?: "PG13"|"R"; useStats?: boolean }){
  const mode = (window as any).__snobify_mode ?? "R";
  const useStats = (window as any).__snobify_useStats ?? true;
  const p = buildSummary(stats, mode, useStats);
  return (
    <div className="card" data-card="summary">
      <div className="title">Final Summary</div>
      <p style={{fontSize:16, lineHeight:1.5}}>{p}</p>
      <div className="muted">Mode: {mode} • Stats: {String(useStats)}</div>
    </div>
  );
}