type Row = {
  ["Track URI"]: string; ["Artist Name(s)"]: string; ["Track Name"]: string; ["Genres"]?: string;
  ["Popularity"]?: number; ["Valence"]?: number; ["Energy"]?: number; ["Danceability"]?: number;
  ["Acousticness"]?: number; ["Instrumentalness"]?: number; ["Added At"]?: string; ["Played At"]?: string; ["Release Date"]?: string;
};
const num = (v:any, f=0)=> (Number.isFinite(+v)? +v : f);
const monthKey = (d:Date)=> `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;

export function compute(rows: Row[]){
  const plays = rows.map(r=>{
    const ts = r["Played At"] || r["Added At"] || r["Release Date"] || "";
    const d = new Date(ts);
    return {
      ...r, _d:d, _m: isNaN(d.getTime()) ? "unknown" : monthKey(d),
      _pop:num(r["Popularity"]), _val:num(r["Valence"]), _eng:num(r["Energy"]),
      _dac:num(r["Danceability"]), _aco:num(r["Acousticness"]), _ins:num(r["Instrumentalness"])
    };
  }).filter(p=>p._m!=="unknown");

  const gcount = new Map<string,number>();
  for(const p of plays){
    const uniq = Array.from(new Set((p["Genres"]||"").split("|").map(s=>s.trim()).filter(Boolean)));
    for(const g of uniq) gcount.set(g,(gcount.get(g)||0)+1);
  }
  const topUniqueGenres = Array.from(gcount.entries()).sort((a,b)=>b[1]-a[1]).slice(0,15).map(([genre,count])=>({genre,count}));

  const first = new Map<string,Date>();
  for(const p of plays.sort((a,b)=>a._d.getTime()-b._d.getTime())){
    if(!first.has(p["Track URI"])) first.set(p["Track URI"], p._d);
  }
  const disc = new Map<string,number>();
  for(const d of first.values()){ const mk = monthKey(d); disc.set(mk,(disc.get(mk)||0)+1); }
  const discoveryTrend = Array.from(disc.entries()).sort((a,b)=>a[0].localeCompare(b[0])).map(([month,count])=>({month,count}));

  const rareTracks = plays.filter(p=>p._pop>0).sort((a,b)=>a._pop-b._pop).slice(0,25)
    .map(p=>({ name:p["Track Name"], artist:p["Artist Name(s)"], pop:p._pop }));

  const n = plays.length || 1;
  const avg = (k: "_val"|"_eng"|"_dac"|"_aco"|"_ins") => +((plays.reduce((s,p)=>s+p[k],0)/n).toFixed(3));
  const taste = { avgValence:avg("_val"), avgEnergy:avg("_eng"), avgDanceability:avg("_dac"), acousticBias:avg("_aco"), instrumentalBias:avg("_ins") };

  const uniqArtists = new Set(plays.map(p=>p["Artist Name(s)"].toLowerCase())).size;
  const uniqTracks = new Set(plays.map(p=>p["Track URI"])).size;
  const avgPop = plays.reduce((s,p)=>s+p._pop,0)/n;
  const variety = Math.min(100, Math.round((uniqArtists/Math.max(1,uniqTracks))*100));
  const rarityScore = Math.round(100 - Math.min(100, avgPop));
  const cohesion = Math.max(0, 100 - Math.round((variety*0.6 + rarityScore*0.4)));
  const playlistRater = { variety, rarityScore, cohesion, overall: Math.round((variety+rarityScore+cohesion)/3) };

  const acts = new Map<string,number>();
  for(const p of plays){ acts.set(p._m,(acts.get(p._m)||0)+1); }
  const activityTrend = Array.from(acts.entries()).sort((a,b)=>a[0].localeCompare(b[0])).map(([month,count])=>({month,count}));

  const snob = (() => {
    const lines = [
      "Your library oozes underground cred—algorithms tried, failed, and cried. Gorgeous chaos.",
      "This playlist smells like vintage vinyl and questionable life choices. I approve.",
      "You mainline instrumentals like oxygen. Lyrics are optional; taste isn’t."
    ];
    return lines[Math.floor(Math.random()*lines.length)];
  })();

  const start = plays.length? plays[0]._d.toISOString() : "";
  const end   = plays.length? plays[plays.length-1]._d.toISOString() : "";
  return { topUniqueGenres, discoveryTrend, rareTracks, taste, playlistRater, activityTrend, snob, meta:{ hash:"", rows:n, window:{start,end} } };
}
