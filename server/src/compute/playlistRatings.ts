import type { RowEx } from "../ingest/readAll.js";

type Count = { [k: string]: number };
const splitGenres = (s?: string) => (s || "").split(/[|,]/).map(x => x.trim()).filter(Boolean);

export type PlaylistRating = {
  name: string;
  tracks: number;
  uniqueArtists: number;
  cohesion: number;
  variety: number;
  rarity: number;
  creativity: number;
  overall: number;
  topArtists: { name: string; count: number }[];
  topGenres: { genre: string; count: number }[];
};

export function computePlaylistRatings(rows: RowEx[]): PlaylistRating[] {
  const byList = new Map<string, RowEx[]>();
  for (const r of rows) {
    const list = (r as any).__playlist || "unknown";
    if (!byList.has(list)) byList.set(list, []);
    byList.get(list)!.push(r);
  }

  const ratings: PlaylistRating[] = [];
  for (const [name, arr] of byList) {
    if (arr.length < 5) continue;

    const uniqTracks = new Set(arr.map(r => r["Track URI"])).size;
    const artistCounts: Count = {};
    const genreCounts: Count = {};
    let popSum = 0, lowPop = 0;

    for (const r of arr) {
      const a = (r["Artist Name(s)"] || "").toLowerCase();
      artistCounts[a] = (artistCounts[a] || 0) + 1;
      for (const g of splitGenres(r["Genres"])) {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      }
      const pop = Number(r["Popularity"] || 0);
      popSum += pop;
      if (pop <= 20) lowPop++;
    }

    const topArtistCount = Object.values(artistCounts).sort((a,b)=>b-a)[0] || 0;
    const topGenreCount  = Object.values(genreCounts).sort((a,b)=>b-a)[0] || 0;
    const cohesionArtists = topArtistCount / arr.length;
    const cohesionGenres  = topGenreCount  / Math.max(1, arr.length);
    const cohesion = Math.round((cohesionArtists * 0.55 + cohesionGenres * 0.45) * 100);

    const uniqueArtists = Object.keys(artistCounts).length;
    const variety = Math.min(100, Math.round((uniqueArtists / Math.max(1, uniqTracks)) * 100));
    const rarity = Math.round(100 - Math.min(100, popSum / arr.length));
    const crossGenre = Math.min(100, Math.round((Object.keys(genreCounts).length / Math.sqrt(arr.length)) * 25));
    const deepCutBoost = Math.round((lowPop / arr.length) * 50);
    const creativity = Math.max(0, Math.min(100, Math.round(0.6 * crossGenre + 0.4 * deepCutBoost)));

    // Cohesion heavier for individual playlists (your preference)
    const overall = Math.round(0.45 * cohesion + 0.15 * variety + 0.25 * rarity + 0.15 * creativity);

    const topArtists = Object.entries(artistCounts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,count])=>({ name, count }));
    const topGenres  = Object.entries(genreCounts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([genre,count])=>({ genre, count }));

    ratings.push({ name, tracks: arr.length, uniqueArtists, cohesion, variety, rarity, creativity, overall, topArtists, topGenres });
  }
  ratings.sort((a,b)=>b.overall - a.overall);
  return ratings;
}