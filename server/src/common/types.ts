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
  decadeBreakdown?: { decade:string; pct:number }[];
  genreArtists?:    { genre:string; artists:string[] }[];
  recentTracks?:    { name:string; artist:string; genres:string[]; playedAt:string }[];
  topArtists?:      { artist:string; trackCount:number; playCount:number; avgPop:number; topTrack:string }[];
  _counters?: { uniqueTracks:number; uniquePlays:number };
  meta: { hash:string; rows:number; files:number; skipped:number; window:{ start:string; end:string } };
};
export type ErrorEnvelope = {
  error: { code:string; message:string; reqId:string; hint?:string; details?:unknown };
};