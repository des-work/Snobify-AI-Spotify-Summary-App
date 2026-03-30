type Row = {
  ["Track URI"]: string; ["Artist Name(s)"]: string; ["Track Name"]: string; ["Genres"]?: string;
  ["Popularity"]?: number; ["Valence"]?: number; ["Energy"]?: number; ["Danceability"]?: number;
  ["Acousticness"]?: number; ["Instrumentalness"]?: number; ["Added At"]?: string; ["Played At"]?: string; ["Release Date"]?: string;
};

const num = (v:any, f=0)=> (Number.isFinite(+v)? +v : f);
const monthKey = (d:Date)=> `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;

const GENRE_ALIASES: Record<string,string> = {
  "hip hop":"hip-hop", "hip-hop":"hip-hop", "lo fi":"lo-fi", "lo-fi beats":"lo-fi", "lofi":"lo-fi",
  "brooklyn drill":"drill - brooklyn", "new york drill":"drill - ny", "chicago drill":"drill - chicago"
};
function normGenre(g:string){
  let s = g.trim().toLowerCase();
  s = s.replace(/\s+/g, " ");
  if (GENRE_ALIASES[s]) return GENRE_ALIASES[s];
  return s;
}
function parseDate(r:Row){
  const ts = r["Played At"] || r["Added At"] || r["Release Date"] || "";
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
}
function entropy(ps: number[]){
  const sum = ps.reduce((a,b)=>a+b,0) || 1;
  const p = ps.map(x=> x/sum).filter(x=>x>0);
  const h = -p.reduce((a,x)=> a + x*Math.log(x), 0);
  const hmax = Math.log(p.length || 1);
  return hmax===0 ? 0 : (h/hmax); // normalized 0..1
}

export function compute(rows: Row[], opts?: {
  cutoffMonth?: string, dropPreSpotify?: boolean, topGenresLimit?: number, weightedAverages?: boolean,
  rareMode?: "topN"|"percentile", rareN?: number, rarePercentile?: number
}){
  const cutoffMonth = opts?.cutoffMonth ?? "2008-10";
  const dropPre     = opts?.dropPreSpotify ?? true;
  const topGenres   = opts?.topGenresLimit ?? 25;
  const weighted    = opts?.weightedAverages ?? true;
  const rareMode    = opts?.rareMode ?? "topN";
  const rareN       = opts?.rareN ?? 25;
  const rarePct     = opts?.rarePercentile ?? 5;

  // Normalize + timestamp
  const plays = rows.map(r=>{
    const d = parseDate(r);
    return {
      ...r, _d: d, _m: d ? monthKey(d) : null,
      _pop:num(r["Popularity"]), _val:num(r["Valence"]), _eng:num(r["Energy"]),
      _dac:num(r["Danceability"]), _aco:num(r["Acousticness"]), _ins:num(r["Instrumentalness"])
    };
  });

  // Apply cutoff
  const cutoffOk = (mk:string|null) => {
    if (!mk) return false;
    if (!dropPre) return true;
    return mk >= cutoffMonth;
  };
  const playsCut = plays.filter(p => p._m && cutoffOk(p._m));

  // Unique tracks (URI) for track-level stats
  const seenTrack = new Set<string>();
  const uniqueTracks = playsCut.filter(p=>{
    if(!p["Track URI"]) return false;
    if(seenTrack.has(p["Track URI"])) return false;
    seenTrack.add(p["Track URI"]);
    return true;
  });

  // Unique (URI,timestamp) for activity
  const seenPlay = new Set<string>();
  const uniquePlays = playsCut.filter(p=>{
    if(!p["Track URI"] || !p._d) return false;
    const k = p["Track URI"] + "|" + p._d.toISOString();
    if (seenPlay.has(k)) return false;
    seenPlay.add(k);
    return true;
  });

  // Per-track play count (for weighting)
  const playsPerTrack = new Map<string, number>();
  for(const p of uniquePlays){
    const key = p["Track URI"];
    playsPerTrack.set(key, (playsPerTrack.get(key) || 0) + 1);
  }

  // Top unique genres (count a genre once per track, normalized labels)
  const gcount = new Map<string,number>();
  for(const p of uniqueTracks){
    const raw = (p["Genres"]||"").split(/[|,]/).map(s=>normGenre(s)).filter(Boolean);
    const uniq = Array.from(new Set(raw));
    for(const g of uniq) gcount.set(g,(gcount.get(g)||0)+1);
  }
  const topUniqueGenres = Array.from(gcount.entries())
    .sort((a,b)=>b[1]-a[1]).slice(0, topGenres).map(([genre,count])=>({genre,count}));

  // Decade breakdown: what release-year eras do unique tracks come from?
  const decadeMap = new Map<string,number>();
  for(const p of uniqueTracks){
    const rd = p["Release Date"];
    if(!rd) continue;
    const y = new Date(String(rd)).getUTCFullYear();
    if(!Number.isFinite(y) || y < 1900 || y > 2030) continue;
    const dec = String(Math.floor(y/10)*10);
    decadeMap.set(dec,(decadeMap.get(dec)||0)+1);
  }
  const decTotal = uniqueTracks.length || 1;
  const decadeBreakdown = Array.from(decadeMap.entries())
    .sort((a,b)=>a[0].localeCompare(b[0]))
    .map(([decade,count])=>({ decade, pct: Math.round((count/decTotal)*100) }));

  // Top 3 artists per genre (powers the genre deep-dive slide)
  const artistsByGenre = new Map<string, Map<string,number>>();
  for(const p of uniqueTracks){
    const raw = (p["Genres"]||"").split(/[|,]/).map((s:string)=>normGenre(s)).filter(Boolean);
    const gs  = Array.from(new Set(raw));
    // Use only the first credited artist to avoid "feat." noise
    const artist = (p["Artist Name(s)"]||"").split(",")[0].trim();
    if(!artist) continue;
    for(const g of gs){
      const m = artistsByGenre.get(g) ?? new Map<string,number>();
      m.set(artist,(m.get(artist)||0)+1);
      artistsByGenre.set(g,m);
    }
  }
  const genreArtists = topUniqueGenres.map(({genre})=>{
    const m = artistsByGenre.get(genre);
    const artists = m
      ? [...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([name])=>name)
      : [];
    return { genre, artists };
  });

  // Recent tracks: most recently played unique tracks (for recency slide)
  const recentSorted = [...uniquePlays]
    .filter(p => p._d)
    .sort((a, b) => b._d!.getTime() - a._d!.getTime());
  const seenRecent = new Set<string>();
  const recentDeduped: typeof recentSorted = [];
  for (const p of recentSorted) {
    if (!p["Track URI"] || seenRecent.has(p["Track URI"])) continue;
    seenRecent.add(p["Track URI"]);
    recentDeduped.push(p);
    if (recentDeduped.length >= 15) break;
  }
  const recentTracks = recentDeduped.map(p => ({
    name:     p["Track Name"] || '',
    artist:   (p["Artist Name(s)"] || '').split(',')[0].trim(),
    genres:   (p["Genres"] || '').split(/[|,]/).map((s:string)=>normGenre(s)).filter(Boolean).slice(0, 3),
    playedAt: p._d!.toISOString(),
  }));

  // Top artists overall by unique-track count (for artist roast slide)
  const artistStats = new Map<string,{ tracks:number; plays:number; popSum:number; topTrack:string }>();
  for (const p of uniqueTracks) {
    const artist = (p["Artist Name(s)"] || '').split(',')[0].trim();
    if (!artist) continue;
    const ex = artistStats.get(artist) ?? { tracks:0, plays:0, popSum:0, topTrack:'' };
    artistStats.set(artist, {
      tracks:   ex.tracks + 1,
      plays:    ex.plays + (playsPerTrack.get(p["Track URI"]) || 1),
      popSum:   ex.popSum + p._pop,
      topTrack: ex.topTrack || (p["Track Name"] || ''),
    });
  }
  const topArtists = [...artistStats.entries()]
    .sort((a,b) => b[1].tracks - a[1].tracks)
    .slice(0, 20)
    .map(([artist,{ tracks, plays, popSum, topTrack }]) => ({
      artist,
      trackCount: tracks,
      playCount:  plays,
      avgPop:     tracks > 0 ? Math.round(popSum / tracks) : 0,
      topTrack,
    }));

  // First-play discovery per month (earliest timestamp per track)
  const firstByTrack = new Map<string, Date>();
  for(const p of uniquePlays.sort((a,b)=> (a._d!.getTime()-b._d!.getTime()))){
    const uri = p["Track URI"];
    if(!firstByTrack.has(uri)) firstByTrack.set(uri, p._d!);
  }
  const disc = new Map<string,number>();
  for(const d of firstByTrack.values()){
    const mk = monthKey(d);
    disc.set(mk,(disc.get(mk)||0)+1);
  }
  const discoveryTrend = Array.from(disc.entries()).sort((a,b)=>a[0].localeCompare(b[0])).map(([month,count])=>({month,count}));

  // Rare tracks
  const baseRare = uniqueTracks.filter(p=>p._pop>0).sort((a,b)=>a._pop-b._pop);
  let rareTracks = baseRare.slice(0, rareN)
    .map(p=>({ name:p["Track Name"], artist:p["Artist Name(s)"], pop:p._pop }));
  if (rareMode === "percentile" && baseRare.length>0){
    const k = Math.max(1, Math.floor(baseRare.length * (rarePct/100)));
    rareTracks = baseRare.slice(0, k).map(p=>({ name:p["Track Name"], artist:p["Artist Name(s)"], pop:p._pop }));
  }

  // Taste (weighted or unweighted)
  const sourceForTaste = uniqueTracks;
  const n = sourceForTaste.length || 1;
  const w = (uri:string)=> (weighted ? (playsPerTrack.get(uri)||1) : 1);
  const sumW = sourceForTaste.reduce((s,p)=> s + w(p["Track URI"]), 0) || 1;
  const wavg = (k: "_val"|"_eng"|"_dac"|"_aco"|"_ins") =>
    +((sourceForTaste.reduce((s,p)=> s + w(p["Track URI"])*p[k], 0) / sumW).toFixed(3));
  const taste = { avgValence:wavg("_val"), avgEnergy:wavg("_eng"), avgDanceability:wavg("_dac"),
                  acousticBias:wavg("_aco"), instrumentalBias:wavg("_ins") };

  // Playlist rater v2
  const uniqArtists = new Set(sourceForTaste.map(p=> (p["Artist Name(s)"]||"").toLowerCase())).size;
  const uniqTracks = new Set(sourceForTaste.map(p=> p["Track URI"])).size;
  const variety = Math.min(100, Math.round((uniqArtists / Math.max(1, uniqTracks)) * 100));
  const avgPop = sourceForTaste.reduce((s,p)=> s + p._pop * w(p["Track URI"]), 0)/ sumW;
  const rarityScore = Math.round(100 - Math.min(100, avgPop));

  // Cohesion via genre entropy (lower entropy => more themed). Map to 0..100 where 100 = most cohesive
  const totalGenres = new Map<string,number>();
  for(const p of sourceForTaste){
    const uniq = Array.from(new Set((p["Genres"]||"").split(/[|,]/).map(normGenre).filter(Boolean)));
    for(const g of uniq) totalGenres.set(g,(totalGenres.get(g)||0)+1);
  }
  const counts = Array.from(totalGenres.values());
  const Hn = counts.length ? entropy(counts) : 0; // 0..1
  const cohesion = Math.round((1 - Hn) * 100);    // 100 = single theme

  const creativity = Math.round(0.6*variety + 0.4*rarityScore);
  const overall = Math.round(0.35*rarityScore + 0.35*cohesion + 0.15*variety + 0.15*creativity);
  const playlistRater = { variety, rarityScore, cohesion, creativity, overall };

  // Activity trend: per month using unique (track,timestamp) plays
  const acts = new Map<string,number>();
  for(const p of uniquePlays){ acts.set(p._m!, (acts.get(p._m!)||0)+1); }
  const activityTrend = Array.from(acts.entries()).sort((a,b)=>a[0].localeCompare(b[0])).map(([month,count])=>({month,count}));

  // Snob line (unchanged for now; UI toggle will handle PG-13/R)
  const snob = (() => {
    const lines = [
      "Your library oozes underground cred—algorithms tried, failed, and cried. Gorgeous chaos.",
      "This playlist smells like vintage vinyl and questionable life choices. I approve.",
      "You mainline instrumentals like oxygen. Lyrics are optional; taste isn’t."
    ];
    return lines[Math.floor(Math.random()*lines.length)];
  })();

  const sorted = uniquePlays.filter(p=>p._d).sort((a,b)=> (a._d!.getTime()-b._d!.getTime()));
  const start = sorted.length? sorted[0]._d!.toISOString() : "";
  const end   = sorted.length? sorted[sorted.length-1]._d!.toISOString() : "";

  return {
    topUniqueGenres, discoveryTrend, rareTracks, taste, playlistRater, activityTrend, snob,
    decadeBreakdown, genreArtists, recentTracks, topArtists,
    _counters: { uniqueTracks: uniqTracks, uniquePlays: uniquePlays.length },
    meta:{ hash:"", rows: uniquePlays.length, files: 0, skipped: 0, window:{start,end} }
  };
}