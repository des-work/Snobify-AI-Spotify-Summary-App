export type Taste = {
  avgValence:number; avgEnergy:number; avgDanceability:number;
  acousticBias:number; instrumentalBias:number;
};
export type Stats = {
  topUniqueGenres: { genre:string; count:number }[];
  discoveryTrend: { month:string; count:number }[];
  rareTracks: { name:string; artist:string; pop:number }[];
  taste: Taste;
  playlistRater: { variety:number; rarityScore:number; cohesion:number; overall:number };
  activityTrend: { month:string; count:number }[];
  snob: string;
  meta: { hash:string; rows:number; window:{ start:string; end:string } };
};
export type ErrorEnvelope = {
  error: { code:string; message:string; reqId:string; hint?:string; details?:unknown };
};
