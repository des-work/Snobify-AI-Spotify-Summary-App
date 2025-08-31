import { lookupOrigin } from "./origin.js";
import type { TrackRow } from "../ingest/readCsv.js";

type Row = TrackRow & { _srcFile?: string };

export type TasteOptions = {
  nichePopularityThreshold: number;   // default 31 (40 - 9)
  playWeight: number;                 // default 0.7
  uniqueWeight: number;               // default 0.3
  recencyBoostMax: number;            // cap = 0.10 (10%)
  notYouDownweight: number;           // 0.5 when Added By != you (off if no aliases)
  userAliases: string[];              // lowercase usernames treated as "you"
  playlistWeightCapPct: number;       // cap max influence by any single source (e.g., 35%)
  minRows: number;                    // e.g., 300
};

export type TasteProfile = {
  label: string;                      // playful, descriptive
  score: number;                      // 0..100 aggregate
  metrics: {
    variety: number;                  // 0..100  (genre spread)
    rarity: number;                   // 0..100  (lower pop -> higher rarity)
    cohesion: number;                 // 0..100  (genre focus)
    exploration: number;              // 0..100  (new artists/unique-per-play)
    internationality: number;         // 0..100  (non-US share)
    eraBalance: number;               // 0..100  (spread across 5y/decades)
    replayRate: number;               // 0..100  (repeats vs uniques)
  };
  breakdowns: {
    byDecade: { decade: string; count: number }[];
    by5y: { band: string; count: number }[];
    countries: { name: string; count: number }[];
    continents: { name: string; count: number }[];
    topGenres: { name: string; count: number }[];
    favoritesPerGenre: { genre: string; artists: { name:string; count:number }[] }[];
  };
  evidence: string[];                 // Why this profile (bullets)
  provisional?: boolean;              // true if < min data
  rudeMessage?: string;               // snark if provisional
};

const now = ()=> new Date();
const yr = (d: Date)=> d.getUTCFullYear();

const splitGenres = (s?: string) => (s || "").split(/[|,]/).map(x=>x.trim()).filter(Boolean);
const splitArtists = (s?: string) => (s || "").split(",").map(x=>x.trim()).filter(Boolean);

function safeDate(s?: string){
  if(!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function recencyBoost(playedAt?: string, max=0.10){
  // 0..10% boost; decays with age (half-life ~ 18 months)
  const d = safeDate(playedAt);
  if(!d) return 0;
  const years = (now().getTime() - d.getTime()) / (365.25*24*3600*1000);
  const boost = max * Math.exp(-years / 1.5);
  return Math.min(max, Math.max(0, boost));
}

function entropyNorm(counts: number[]){
  const total = counts.reduce((s,n)=>s+n,0) || 1;
  const ps = counts.filter(n=>n>0).map(n=>n/total);
  const H = -ps.reduce((s,p)=> s + p * Math.log2(p), 0);
  const Hmax = Math.log2(Math.max(2, ps.length));
  return Hmax ? H/Hmax : 0; // 0..1
}

function topCounts(items: string[], top = 10) {
  const m = new Map<string, number>();
  for (const it of (Array.isArray(items) ? items : [])) {
    if (!it) continue;
    m.set(it, (m.get(it) || 0) + 1);
  }
  return [...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0, top).map(([name, count]) => ({ name, count }));
}

function byDecade(years: number[]){
  const m = new Map<string, number>();
  for(const y of years){ const d = Math.floor(y/10)*10; m.set(String(d), (m.get(String(d))||0)+1); }
  return [...m.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([decade,count])=>({decade,count}));
}

function by5y(years: number[]){
  const m = new Map<string, number>();
  for(const y of years){
    const base = Math.floor((y - 1900)/5)*5 + 1900;
    const band = `${base}-${base+4}`;
    m.set(band, (m.get(band)||0)+1);
  }
  return [...m.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([band,count])=>({band,count}));
}

function clamp(n:number, lo=0, hi=100){ return Math.max(lo, Math.min(hi, n)); }

export function buildTasteProfile(rowsIn: Row[], opts?: Partial<TasteOptions>): TasteProfile {
  const cfg: TasteOptions = {
    nichePopularityThreshold: 31, // "Spotify - 9" (assuming ~40 as common niche cutoff)
    playWeight: 0.7,
    uniqueWeight: 0.3,
    recencyBoostMax: 0.10,
    notYouDownweight: 0.5,
    userAliases: [],              // set in config if you want downweight to apply
    playlistWeightCapPct: 35,     // at most 35% weight from a single playlist/source
    minRows: 300,
    ...(opts||{})
  };

  const rows = Array.isArray(rowsIn) ? rowsIn : [];
  const total = rows.length;

  if(total < cfg.minRows){
    return {
      label: "Insufficient Data (Provisional)",
      score: 0,
      metrics: { variety:0, rarity:0, cohesion:0, exploration:0, internationality:0, eraBalance:0, replayRate:0 },
      breakdowns: { byDecade:[], by5y:[], countries:[], continents:[], topGenres:[], favoritesPerGenre:[] },
      evidence: [],
      provisional: true,
      rudeMessage: "Come back when your library isn’t a kiddie pool. I need at least 300 real plays to judge you properly."
    };
  }

  // === weights per row ===
  // base: each play counts; boost recency up to 10%; downweight if not added-by you (if aliases set)
  const sourceWeight = new Map<string, number>();
  const weights: number[] = [];
  const artistHits = new Map<string, number>();
  const artistFirstSeen = new Map<string, number>(); // epoch

  let popSum = 0;
  let nichePlays = 0;
  const yearsRelease:number[] = [];
  const yearsListen:number[] = [];
  const genreList:string[] = [];
  const countryCounts = new Map<string, number>();
  const continentCounts = new Map<string, number>();

  for(const r of rows){
    const played = r["Played At"] || r["Added At"];
    const yListen = safeDate(played); if(yListen) yearsListen.push(yr(yListen));
    const yRelease = safeDate(r["Release Date"]); if(yRelease) yearsRelease.push(yr(yRelease));

    const g = splitGenres(r["Genres"]); genreList.push(...g);
    const artists = splitArtists(r["Artist Name(s)"]).map(a=>a.toLowerCase());

    const rec = recencyBoost(played, cfg.recencyBoostMax); // ≤ 10%
    // Optional "not you" downweight if aliases provided
    let byYou = true;
    if(cfg.userAliases.length){
      const adder = String(r["Added By"]||"").toLowerCase();
      byYou = cfg.userAliases.includes(adder);
    }
    let w = 1 + rec;
    if(!byYou && cfg.userAliases.length) w *= cfg.notYouDownweight;

    // cap influence of any single *source file* if present
    const src = String((r as any)._srcFile || "");
    if(src){
      const prev = sourceWeight.get(src) || 0;
      const cap = Math.max(1, Math.round(total * (cfg.playlistWeightCapPct/100)));
      if(prev >= cap){ w = 0; } else { sourceWeight.set(src, prev + 1); }
    }
    weights.push(w);

    const pop = Number(r["Popularity"]||0);
    if(Number.isFinite(pop)) popSum += pop;
    if(pop < cfg.nichePopularityThreshold) nichePlays++;

    // artist stats
    const ts = yListen ? yListen.getTime() : 0;
    for(const a of artists){
      artistHits.set(a, (artistHits.get(a)||0) + 1);
      if(!artistFirstSeen.has(a) || (ts && ts < (artistFirstSeen.get(a)||Infinity))) artistFirstSeen.set(a, ts);
      // origin
      const o = lookupOrigin(a) || null;
      const country = (o?.country || "Unknown").toUpperCase();
      const cont    = (o?.continent || "Unknown").toUpperCase();
      countryCounts.set(country, (countryCounts.get(country)||0)+1);
      continentCounts.set(cont, (continentCounts.get(cont)||0)+1);
    }
  }

  // === metrics ===
  const wTotal = weights.reduce((s,n)=>s+n,0) || 1;

  // Variety (genre spread, normalized)
  const gCounts = new Map<string, number>();
  for(const g of genreList){ gCounts.set(g, (gCounts.get(g)||0)+1); }
  const variety = clamp(Math.round(100 * (gCounts.size / Math.max(10, genreList.length/10)))); // heuristic

  // Cohesion (inverse entropy of genres)
  const counts = [...gCounts.values()];
  const Hn = entropyNorm(counts);        // 0..1 (1 means very diverse)
  const cohesion = clamp(Math.round((1 - Hn) * 100));

  // Rarity (lower avg popularity -> higher rarity)
  const avgPop = popSum/(total||1);
  const rarity = clamp(Math.round(100 - avgPop)); // 0..100

  // Replay vs Exploration
  const uniqueArtists = artistHits.size || 1;
  const repeats = [...artistHits.values()].filter(n=>n>1).reduce((s,n)=>s+n-1,0);
  const replayRate = clamp(Math.round(100 * (repeats / total)));
  // Exploration: share of artists first seen in the most recent 20% time window
  const firsts = [...artistFirstSeen.values()].filter(x=>x>0).sort((a,b)=>a-b);
  const cutIdx = Math.floor(firsts.length*0.8);
  const recentNew = firsts.slice(cutIdx).length;
  const exploration = clamp(Math.round(100 * (recentNew / Math.max(1, uniqueArtists))));

  // Internationality
  const nonUS = (countryCounts.get("US") ? (wTotal - (countryCounts.get("US")||0)) : wTotal);
  const internationality = clamp(Math.round(100 * (nonUS / Math.max(1, wTotal))));

  // Era balance (spread across 5y + decade)
  const d5 = by5y(yearsRelease);
  const dec = byDecade(yearsRelease);
  const eraBalance = clamp(Math.round((1 - entropyNorm(d5.map(x=>x.count))) * 100));

  // Weighted aggregate (your weights)
  // Cohesion 30%, Rarity 25%, Variety 15%, Exploration 15%, Internationality 10%, Era Balance 5%
  const score = Math.round(
    cohesion*0.30 + rarity*0.25 + variety*0.15 + exploration*0.15 + internationality*0.10 + eraBalance*0.05
  );

  // Persona label (playful but descriptive)
  let label = "Balanced Explorer";
  if(rarity>=60 && exploration>=60) label = "Deep-Cut Connoisseur";
  else if(internationality>=35 && variety>=60) label = "Global Genre Hopper";
  else if(cohesion>=70 && variety<=40) label = "Cohesive Devotee";
  else if(dec.length && (dec[0].decade <= "2000") && cohesion>=55) label = "Retro Faithful";
  else if(d5.length && d5.slice(-2).reduce((s,b)=>s+b.count,0) / (yearsRelease.length||1) >= 0.7) label = "Modern Maximizer";

  // Favorites per genre — dynamic: artists with >= max(3, 5% of genre plays) & in top 20% share
  const favs = favoritesPerGenre(rows);

  // Evidence
  const topGenres = [...gCounts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,count])=>({name,count}));
  const countries = [...countryCounts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name,count])=>({name,count}));
  const continents = [...continentCounts.entries()].sort((a,b)=>b[1]-a[1]).map(([name,count])=>({name,count}));

  const evidence = [
    `Top genres: ${topGenres.map(g=>g.name).join(", ")}`,
    `Avg track popularity ~${Math.round(avgPop)} ⇒ rarity ${rarity}`,
    `Exploration ${exploration} (recent new-artist share) vs replay rate ${replayRate}`,
    `Internationality ${internationality} with ${countries[0]?.name||"Unknown"} leading`,
    `Cohesion ${cohesion} (genre concentration) • Variety ${variety}`
  ];

  return {
    label,
    score,
    metrics: { variety, rarity, cohesion, exploration, internationality, eraBalance, replayRate },
    breakdowns: {
      byDecade: dec,
      by5y: d5,
      countries,
      continents,
      topGenres,
      favoritesPerGenre: favs
    },
    evidence
  };
}

function favoritesPerGenre(rows: Row[]){
  const gMap = new Map<string, Map<string, number>>();
  const gTotal = new Map<string, number>();
  for(const r of rows){
    const gs = splitGenres(r["Genres"]);
    const artists = splitArtists(r["Artist Name(s)"]).map(a=>a.toLowerCase());
    for(const g of gs){
      const m = gMap.get(g) || new Map<string, number>();
      for(const a of artists){ m.set(a,(m.get(a)||0)+1); }
      gMap.set(g,m);
      gTotal.set(g,(gTotal.get(g)||0)+artists.length);
    }
  }
  const out: { genre: string; artists: { name:string; count:number }[] }[] = [];
  for(const [g,m] of gMap){
    const tot = gTotal.get(g)||1;
    const entries = [...m.entries()].sort((a,b)=>b[1]-a[1]);
    const minAbs = Math.max(3, Math.round(tot*0.05));
    const top = entries.filter(([,c])=>c>=minAbs);
    const top20pctCut = Math.max(1, Math.round(top.length*0.2));
    out.push({ genre: g, artists: top.slice(0, top20pctCut).map(([name,count])=>({name,count})) });
  }
  return out;
}