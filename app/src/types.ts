export type GenreCount = { genre: string; count: number };
export type TrendPoint = { month: string; count: number };
export type RareTrack = { name: string; artist: string; pop: number };
export type Taste = { avgValence:number; avgEnergy:number; avgDanceability:number; acousticBias:number; instrumentalBias:number };
export type PlaylistRater = { variety:number; rarityScore:number; cohesion:number; creativity?:number; overall:number };
export type Stats = {
  topUniqueGenres: GenreCount[];
  discoveryTrend: TrendPoint[];
  rareTracks: RareTrack[];
  taste: Taste;
  playlistRater: PlaylistRater;
  activityTrend: TrendPoint[];
  snob: string;
  _counters?: { uniqueTracks:number; uniquePlays:number };
  meta: { hash:string; rows:number; files?:number; skipped?:number; window:{start:string; end:string} };
};
export type StatsResponse = { profile:string; stats: Stats };