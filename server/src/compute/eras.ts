export type Era = { id: string; label: string; start: number; end: number; genreHints?: string[] };

// Sensible default map (adjustable later)
export const DefaultEras: Era[] = [
  { id: "roots",    label: "Blues & Roots",          start: 1900, end: 1959, genreHints:["blues","delta","ragtime"] },
  { id: "hippie",   label: "Hippie / Psychedelic",   start: 1967, end: 1975, genreHints:["psychedelic","hippie","acid rock"] },
  { id: "soulfunk", label: "Classic Soul & Funk",    start: 1965, end: 1979, genreHints:["soul","funk","motown"] },
  { id: "goldhip",  label: "Golden-Age Hip-Hop",     start: 1986, end: 1996, genreHints:["hip hop","rap","boom bap"] },
  { id: "rnb90s",   label: "90s R&B",                start: 1990, end: 1999, genreHints:["r&b","new jack","neo soul"] },
  { id: "indie00s", label: "2000s Indie/Blog",       start: 2000, end: 2009, genreHints:["indie","blog","garage revival"] },
  { id: "pop10s",   label: "Streaming Pop 2010s",    start: 2010, end: 2019, genreHints:["pop","edm","trap pop"] },
  { id: "now20s",   label: "Current 2020s",          start: 2020, end: 2100, genreHints:["all"] }
];