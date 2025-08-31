import type { RowEx } from "../ingest/readAll.js";

const splitGenres = (s?: string) => (s || "").split(/[|,]/).map(x => x.trim()).filter(Boolean);
const yearOf = (z?: string) => {
  if (!z) return NaN;
  const d = new Date(z);
  return isNaN(d.getTime()) ? NaN : d.getUTCFullYear();
};

export function analyzeLibrary(rowsIn: RowEx[]) {
  const rows: RowEx[] = Array.isArray(rowsIn) ? rowsIn : [];
  const nowYear = new Date().getUTCFullYear();
  const minSpotifyYear = 2008;

  const listenYears: number[] = [];
  const vintage: RowEx[] = [];
  const modern: RowEx[] = [];

  for (const r of rows) {
    const yListen = yearOf(r?.["Played At"] || r?.["Added At"]);
    if (!isNaN(yListen) && yListen >= minSpotifyYear) listenYears.push(yListen);

    const yRelease = yearOf(r?.["Release Date"]);
    if (!isNaN(yRelease)) {
      if (nowYear - yRelease >= 10) vintage.push(r); else modern.push(r);
    }
  }
  listenYears.sort((a,b)=>a-b);

  const timeDepth = {
    earliestYear: listenYears.length ? listenYears[0] : null,
    latestYear:   listenYears.length ? listenYears[listenYears.length - 1] : null,
    spanYears:    listenYears.length ? (listenYears[listenYears.length - 1] - listenYears[0] + 1) : 0,
    decades: byDecade(listenYears)
  };

  const topGenresAll     = topCounts(rows.flatMap(r=>splitGenres(r?.["Genres"])), 15);
  const topGenresVintage = topCounts(vintage.flatMap(r=>splitGenres(r?.["Genres"])), 10);
  const topGenresModern  = topCounts(modern.flatMap(r=>splitGenres(r?.["Genres"])), 10);

  const setV = new Set((topGenresVintage ?? []).map(x=>x.name));
  const setM = new Set((topGenresModern  ?? []).map(x=>x.name));
  const genreContrast = jaccardContrast(setV, setM);

  const favoritesPerGenre = topArtistsPerGenre(rows, 8, 5);

  return {
    timeDepth,
    vintageGenresTop: topGenresVintage ?? [],
    topGenresAll: topGenresAll ?? [],
    topGenresModern: topGenresModern ?? [],
    genreContrast: Number.isFinite(genreContrast) ? genreContrast : 0,
    favoritesPerGenre: favoritesPerGenre ?? []
  };
}

function byDecade(years: number[]) {
  const m = new Map<string, number>();
  for (const y of (Array.isArray(years) ? years : [])) {
    const d = Math.floor(y / 10) * 10;
    m.set(String(d), (m.get(String(d)) || 0) + 1);
  }
  return [...m.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([decade, count]) => ({ decade, count }));
}

function topCounts(items: string[], top = 10) {
  const m = new Map<string, number>();
  for (const it of (Array.isArray(items) ? items : [])) {
    if (!it) continue;
    m.set(it, (m.get(it) || 0) + 1);
  }
  return [...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0, top).map(([name, count]) => ({ name, count }));
}

function jaccardContrast(a: Set<string>, b: Set<string>) {
  const A = a ?? new Set<string>(); const B = b ?? new Set<string>();
  const inter = new Set([...A].filter(x => B.has(x))).size;
  const union = new Set([...A, ...B]).size || 1;
  const j = inter / union; // 0..1 similarity
  return Math.round((1 - j) * 100);
}

function topArtistsPerGenre(rowsIn: RowEx[], topGenres = 8, artistsPer = 5) {
  const rows: RowEx[] = Array.isArray(rowsIn) ? rowsIn : [];
  const genreCounts = new Map<string, number>();
  for (const r of rows) for (const g of splitGenres(r?.["Genres"])) {
    genreCounts.set(g, (genreCounts.get(g) || 0) + 1);
  }
  const genres = [...genreCounts.entries()].sort((a,b)=>b[1]-a[1]).slice(0, topGenres).map(([g]) => g);

  const byGenre = new Map<string, Map<string, number>>();
  for (const g of genres) byGenre.set(g, new Map());

  for (const r of rows) {
    const artist = (r?.["Artist Name(s)"] || "").toLowerCase();
    if (!artist) continue;
    for (const g of splitGenres(r?.["Genres"])) {
      if (!byGenre.has(g)) continue;
      const m = byGenre.get(g)!;
      m.set(artist, (m.get(artist) || 0) + 1);
    }
  }

  const out: { genre: string; artists: { name: string; count: number }[] }[] = [];
  for (const g of genres) {
    const m = byGenre.get(g) || new Map();
    const top = [...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0, artistsPer).map(([name, count]) => ({ name, count }));
    out.push({ genre: g, artists: top });
  }
  return out;
}