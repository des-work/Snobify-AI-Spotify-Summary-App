// ─── Frontend Stats types ─────────────────────────────────────────────────────
// Keep this file in sync with server/src/common/types.ts.
// Any field the server always emits should be required here (no `?`).

export type GenreCount   = { genre: string; count: number };
export type TrendPoint   = { month: string; count: number };
export type RareTrack    = { name: string; artist: string; pop: number };

export type Taste = {
  avgValence:       number;
  avgEnergy:        number;
  avgDanceability:  number;
  acousticBias:     number;
  instrumentalBias: number;
};

export type PlaylistRater = {
  variety:      number;
  rarityScore:  number;
  cohesion:     number;
  creativity:   number;   // always emitted by server — not optional
  overall:      number;
};

export type Stats = {
  topUniqueGenres:  GenreCount[];
  discoveryTrend:   TrendPoint[];
  rareTracks:       RareTrack[];
  taste:            Taste;
  playlistRater:    PlaylistRater;
  activityTrend:    TrendPoint[];
  snob:             string;
  _counters?:       { uniqueTracks: number; uniquePlays: number };  // convenience — always present but optional for safety
  meta: {
    hash:    string;
    rows:    number;
    files:   number;    // always emitted by server
    skipped: number;    // always emitted by server
    window:  { start: string; end: string };
  };
};

export type StatsResponse = { profile: string; stats: Stats };
