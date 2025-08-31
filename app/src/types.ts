export type Taste = {
  avgValence:number; avgEnergy:number; avgDanceability:number;
  acousticBias:number; instrumentalBias:number;
};
export type PlaylistRater = {
  variety:number; rarityScore:number; cohesion:number; creativity:number; overall:number;
};
export type Stats = {
  topUniqueGenres: { genre:string; count:number }[];
  discoveryTrend: { month:string; count:number }[];
  rareTracks: { name:string; artist:string; pop:number }[];
  taste: Taste;
  playlistRater: PlaylistRater;
  activityTrend: { month:string; count:number }[];
  snob: string;
  meta: { hash:string; rows:number; files:number; skipped:number; window:{ start:string; end:string } };
};
export type StatsResponse = { profile:string; stats: Stats };