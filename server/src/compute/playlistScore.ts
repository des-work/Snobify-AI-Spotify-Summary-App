import type { RowLike, PlaylistScore } from "./types";
import { DefaultEras } from "./eras";

// ---- Tunable knobs (easy to tweak) ----
export const ScoringConfig = {
  flowTarget: 60,                    // you: Flow is 60 (quality bar)
  minConsistency: 75,                // must be over 75 to be considered "on theme"
  minGenreDiversity: 55,             // at least 55
  minPlaylistSize: 12,               // at least 12 tracks to be judged fully
  mainstreamThresh: 71,              // >=71 mainstream, <=35 niche
  nicheThresh: 35,
  featureArtistWeight: 0.25,         // features count as 0.25 toward artist share
  capPerPlaylistTracks: 80,          // analyze first 80 tracks to avoid big-list bias
  replayPenalty: { mild: 5, medium: 10, strong: 20 }, // you picked mild
  intlUnknownTinyBonus: 0.5,         // small + when origin unknown (lenient)
  // Megastar settings
  megastarMaxShare: 25,              // if an artist >25% of a playlist → penalty
  // Category dampeners
  penalizePop: true,
  penalizeEDMBig15: true,
  penalizeModernCountryBig: true,
  // Rare scene gating
  rareWellCuratedMinScore: 82,       // you set 82
  rareRequiredPlaylists: 3,          // at least 3
  rareMinTracksEach: 10,             // each has >=10
};

// Big-name clusters to slightly dampen when dominating
const BigPop = new Set(["taylor swift","dua lipa","ed sheeran","justin bieber","olivia rodrigo","katy perry","ariana grande","maroon 5","bruno mars","the weeknd"]);
const BigEDM15 = new Set(["david guetta","martin garrix","calvin harris","tiesto","avicii","zedd","kygo","alan walker","marshmello","hardwell","armin van buuren","diplo","afrojack","skrillex","deadmau5"]);
const ModernCountryBig = new Set(["morgan wallen","luke combs","kane brown","luke bryan","jason aldean","thomas rhett"]);

function num(x:any): number { const n = typeof x==="number"?x: Number(String(x??"")); return isFinite(n)?n:0; }
function yearOf(r:RowLike): number {
  const y = num(r["Release Year"]);
  if (y) return y;
  const d = String(r["Release Date"]||"");
  const m = d.match(/^(\d{4})/); return m? Number(m[1]): 0;
}

function splitArtists(r:RowLike): string[] {
  const raw = r["Artist Name(s)"] ?? r["Artists"] ?? r["Artist"] ?? "";
  return String(raw).split(/[,&]/).map(s=>s.trim().toLowerCase()).filter(Boolean);
}

function splitGenres(r:RowLike): string[] {
  const raw = r["Genres"] ?? "";
  return String(raw).toLowerCase().split(/[|,\/]/).map(s=>s.trim()).filter(Boolean);
}

function popularityOf(r:RowLike): number {
  const t = num(r["Track Popularity"] ?? r["Popularity"]);
  if (t) return t;
  const a = num(r["Artist Popularity"]);
  return a || 0;
}

function featureWeightFor(artistIndex:number, totalArtists:number): number {
  // first artist = main; others considered "features"
  return artistIndex===0 ? 1 : ScoringConfig.featureArtistWeight;
}

function vector(r:RowLike){ // for crude "flow" calc
  return [
    num(r["Danceability"]),
    num(r["Energy"]),
    num(r["Valence"])
  ];
}
function dist(a:number[], b:number[]){
  const ax=a[0]-b[0], ay=a[1]-b[1], az=a[2]-b[2];
  const d = Math.sqrt(ax*ax+ay*ay+az*az);
  if (!isFinite(d)) return 0.5; // neutral if missing
  return d; // 0..~1.732
}

function flowScore(rows: RowLike[]): number {
  const n = Math.min(rows.length, ScoringConfig.capPerPlaylistTracks);
  if (n < 2) return 50;
  let total = 0; let steps = 0;
  for(let i=1;i<n;i++){
    total += dist(vector(rows[i-1]), vector(rows[i]));
    steps++;
  }
  if (steps===0) return 50;
  // lower distance → higher flow; map roughly into 0..100
  const avg = total/steps;            // ~0..1.2+
  const score = Math.max(0, 100 - (avg*80)); // heuristic scale
  return Math.round(score);
}

function consistencyPercent(rows: RowLike[]): number {
  // use top genre/theme share
  const cnt = new Map<string, number>();
  const n = Math.min(rows.length, ScoringConfig.capPerPlaylistTracks);
  for(let i=0;i<n;i++){
    const gs = splitGenres(rows[i]); const g = gs[0] || "unknown";
    cnt.set(g,(cnt.get(g)||0)+1);
  }
  const top = [...cnt.values()].reduce((m,v)=>v>m?v:m,0);
  return Math.round(100 * (top / Math.max(1,n)));
}

function genreDiversity(rows: RowLike[]): number {
  const set = new Set<string>();
  const n = Math.min(rows.length, ScoringConfig.capPerPlaylistTracks);
  for(let i=0;i<n;i++){ splitGenres(rows[i]).slice(0,2).forEach(g=>set.add(g)); }
  const distinct = set.size;
  // 1 genre ~ 10, 2 ~ 25, 4 ~ 55, 8 ~ 75, 12+ ~ 90+
  const rough = Math.min(100, Math.round(10 + Math.log2(Math.max(1,distinct))*20));
  return rough;
}

function eraIdOf(year:number){
  const e = DefaultEras.find(e=> year>=e.start && year<=e.end);
  return e? e.id : "unknown";
}
function eraDiversity(rows: RowLike[]): number {
  const set = new Set<string>();
  const n = Math.min(rows.length, ScoringConfig.capPerPlaylistTracks);
  for(let i=0;i<n;i++){ set.add(eraIdOf(yearOf(rows[i]))); }
  const distinct = set.size;
  return Math.min(100, Math.round(distinct * 18)); // 1 era=18, 5 eras~90
}

function shares(rows: RowLike[]){
  const n = Math.min(rows.length, ScoringConfig.capPerPlaylistTracks);
  const artistCounts = new Map<string, number>();
  let mainstream=0, niche=0;
  for(let i=0;i<n;i++){
    const arts = splitArtists(rows[i]);
    arts.forEach((a,idx)=>{
      artistCounts.set(a,(artistCounts.get(a)||0)+featureWeightFor(idx, arts.length));
    });
    const pop = popularityOf(rows[i]);
    if (pop>=ScoringConfig.mainstreamThresh) mainstream++;
    if (pop<ScoringConfig.nicheThresh) niche++;
  }
  const totalWeighted = [...artistCounts.values()].reduce((s,v)=>s+v,0) || 1;
  const megastarShare = [...artistCounts.entries()].reduce((m,[,v])=> Math.max(m, v/totalWeighted), 0);
  return {
    mainstreamShare: Math.round(100 * mainstream/Math.max(1,n)),
    nicheShare: Math.round(100 * niche/Math.max(1,n)),
    megastarShare: Math.round(100 * megastarShare)
  };
}

function replayPenalty(rows: RowLike[]): number {
  const seen = new Map<string, number>();
  const n = Math.min(rows.length, ScoringConfig.capPerPlaylistTracks);
  let dupes = 0;
  for(let i=0;i<n;i++){
    const key = (rows[i]["Track Name"]||"") + "—" + (rows[i]["Artist Name(s)"]||rows[i]["Artist"]||"");
    const c = (seen.get(key)||0)+1; seen.set(key,c);
    if (c>1) dupes++;
  }
  if (dupes===0) return 0;
  return ScoringConfig.replayPenalty.mild; // your choice
}

function intlBonus(rows: RowLike[]): number {
  const n = Math.min(rows.length, ScoringConfig.capPerPlaylistTracks);
  if (n===0) return 0;
  let us=0, non=0, unk=0;
  for(let i=0;i<n;i++){
    const c = String(rows[i]["Country"]||"").toUpperCase();
    if (!c) unk++; else if (c==="US") us++; else non++;
  }
  let bonus = 0;
  if (non>0) bonus += Math.min(3, Math.round(non*0.5)); // tiny up to +3
  if (unk>0) bonus += ScoringConfig.intlUnknownTinyBonus; // lenient for missing
  return bonus;
}

function dampeners(rows: RowLike[]): number {
  // Slightly reduce score if dominated by massive stars or specific clusters
  const n = Math.min(rows.length, ScoringConfig.capPerPlaylistTracks);
  const countByArtist = new Map<string, number>();
  for(let i=0;i<n;i++){
    const arts = splitArtists(rows[i]);
    arts.forEach((a,idx)=>{
      const w = featureWeightFor(idx, arts.length);
      countByArtist.set(a,(countByArtist.get(a)||0)+w);
    });
  }
  const total = [...countByArtist.values()].reduce((s,v)=>s+v,0) || 1;
  const share = (name:string)=> (countByArtist.get(name)||0)/total;

  let penalty = 0;
  // Big pop set
  if (ScoringConfig.penalizePop) {
    for (const a of BigPop) { if (share(a) > 0.18) { penalty += 4; break; } }
  }
  // EDM top 15
  if (ScoringConfig.penalizeEDMBig15) {
    for (const a of BigEDM15) { if (share(a) > 0.18) { penalty += 4; break; } }
  }
  // Modern country cluster
  if (ScoringConfig.penalizeModernCountryBig) {
    for (const a of ModernCountryBig) { if (share(a) > 0.18) { penalty += 3; break; } }
  }
  return penalty;
}

export function scoreOnePlaylist(name:string, rows: RowLike[]): PlaylistScore {
  const size = rows.length;
  const flow = flowScore(rows);
  const consistency = consistencyPercent(rows);
  const genreDiv = genreDiversity(rows);
  const eraDiv = eraDiversity(rows);
  const s = shares(rows);
  const replay = replayPenalty(rows);
  const intl = intlBonus(rows);
  const damp = dampeners(rows);

  const reasons:string[] = [];

  // Base score: start from weighted sum
  let score =
    flow * 0.30 +
    Math.min(consistency, 100) * 0.20 +
    genreDiv * 0.18 +
    eraDiv * 0.12 +
    (100 - s.mainstreamShare) * 0.10 +  // less mainstream = higher
    s.nicheShare * 0.10;

  // Megastar domination penalty
  if (s.megastarShare*1 >= ScoringConfig.megastarMaxShare) {
    score -= 12;
    reasons.push(`Megastar domination: ${s.megastarShare}% from one artist`);
  }

  // Replay penalty & cluster dampeners
  score -= replay;
  if (replay>0) reasons.push(`Replay penalty (dupes): -${replay}`);
  if (damp>0){ score -= damp; reasons.push(`Mainstream cluster dampener: -${damp}`); }

  // Small international bonus
  if (intl>0){ score += intl; reasons.push(`Internationality bonus: +${intl.toFixed(1)}`); }

  // Size floor
  if (size < ScoringConfig.minPlaylistSize) {
    reasons.push(`Too small to judge fully (<${ScoringConfig.minPlaylistSize})`);
    score = Math.min(score, 65); // soft cap
  }

  // Normalization & clamp
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Qualitative notes
  if (flow >= ScoringConfig.flowTarget && consistency >= ScoringConfig.minConsistency) {
    reasons.push(`Strong flow (${flow}) with on-theme consistency (${consistency}%)`);
  } else {
    if (flow < ScoringConfig.flowTarget) reasons.push(`Flow below target (${flow} < ${ScoringConfig.flowTarget})`);
    if (consistency < ScoringConfig.minConsistency) reasons.push(`Consistency below target (${consistency}% < ${ScoringConfig.minConsistency}%)`);
  }
  if (genreDiv >= ScoringConfig.minGenreDiversity) reasons.push(`Good genre diversity (${genreDiv})`);
  return {
    name, size, score, reasons,
    metrics: {
      flow, consistency, genreDiversity: genreDiv, eraDiversity: eraDiv,
      mainstreamShare: s.mainstreamShare, nicheShare: s.nicheShare,
      megastarShare: s.megastarShare, replayPenalty: replay, internationalBonus: intl
    }
  };
}

// Rare scene gate:
// - at least 3 playlists
// - each >=10 tracks
// - and each score >= 82 (well curated)
export function rareEligibilityFromPlaylists(pl: PlaylistScore[]): { rareEligible: boolean; suggestedTop3: string[] } {
  const qualified = pl.filter(p=> p.size>=ScoringConfig.rareMinTracksEach && p.score>=ScoringConfig.rareWellCuratedMinScore);
  const rareEligible = qualified.length >= ScoringConfig.rareRequiredPlaylists;
  const suggestedTop3 = pl.slice().sort((a,b)=>b.score-a.score).slice(0,3).map(p=>p.name);
  return { rareEligible, suggestedTop3 };
}