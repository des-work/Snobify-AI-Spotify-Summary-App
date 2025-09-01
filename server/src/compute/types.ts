export type RowLike = {
  ["Track Name"]?: string;
  ["Artist Name(s)"]?: string;
  ["Artist"]?: string;
  ["Artists"]?: string;
  ["Album"]?: string;
  ["Playlist"]?: string;
  ["Genres"]?: string;
  ["Popularity"]?: number | string;
  ["Track Popularity"]?: number | string;
  ["Artist Popularity"]?: number | string;
  ["Country"]?: string;
  ["Release Year"]?: number | string;
  ["Release Date"]?: string;
  ["Played At"]?: string;
  ["Added At"]?: string;
  // optional audio features if present
  ["Danceability"]?: number | string;
  ["Energy"]?: number | string;
  ["Valence"]?: number | string;
};

export type PlaylistScore = {
  name: string;
  size: number;
  score: number;            // 0..100
  reasons: string[];
  metrics: {
    flow: number;           // 0..100
    consistency: number;    // dominant genre/theme %
    genreDiversity: number; // 0..100
    eraDiversity: number;   // 0..100
    mainstreamShare: number;// % of tracks with popularity >= mainstream threshold
    nicheShare: number;     // % of tracks with popularity < niche threshold
    megastarShare: number;  // max share of a single artist
    replayPenalty: number;  // points subtracted (positive number)
    internationalBonus: number; // small + for intl/mixed and lenient if unknown
  };
};