import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Stats, RareTrack, GenreCount } from '../types';

interface SnobRoastProps {
  stats: Stats;
  profile: string;
  onComplete: () => void;
}

// ─── Genre family system ──────────────────────────────────────────────────────

const GENRE_FAMILIES: { family: string; keywords: string[] }[] = [
  { family: 'Metal',           keywords: ['metal', 'hardcore', 'deathcore', 'screamo', 'thrash', 'doom', 'sludge', 'grindcore'] },
  { family: 'Hip-Hop',         keywords: ['hip-hop', 'hip hop', 'rap', 'trap', 'drill', 'grime', 'cloud rap', 'mumble'] },
  { family: 'K-Pop / J-Pop',   keywords: ['k-pop', 'kpop', 'j-pop', 'jpop', 'j pop', 'k pop', 'city pop', 'korean pop'] },
  { family: 'Electronic',      keywords: ['electronic', 'techno', 'house', 'edm', 'trance', 'drum and bass', 'dnb', 'dubstep', 'garage', 'breakbeat', 'hyperpop', 'synthwave'] },
  { family: 'Ambient',         keywords: ['ambient', 'drone', 'atmospheric', 'dark ambient', 'new age'] },
  { family: 'R&B / Soul',      keywords: ['r&b', 'rnb', 'soul', 'neo soul', 'funk', 'motown', 'quiet storm'] },
  { family: 'Jazz',            keywords: ['jazz', 'bebop', 'fusion', 'bossa nova', 'swing', 'cool jazz'] },
  { family: 'Classical',       keywords: ['classical', 'orchestral', 'opera', 'baroque', 'chamber', 'neoclassical', 'minimalism'] },
  { family: 'Rock',            keywords: ['rock', 'punk', 'grunge', 'emo', 'shoegaze', 'post-rock', 'alt-rock'] },
  { family: 'Folk / Acoustic', keywords: ['folk', 'acoustic', 'singer-songwriter', 'americana', 'bluegrass'] },
  { family: 'Country',         keywords: ['country', 'honky tonk', 'outlaw', 'bro-country'] },
  { family: 'Latin',           keywords: ['latin', 'reggaeton', 'salsa', 'cumbia', 'samba', 'flamenco', 'afrobeats'] },
  { family: 'Lo-Fi / Chill',   keywords: ['lo-fi', 'lofi', 'lo fi', 'chillhop', 'chillwave', 'study beats'] },
  { family: 'Pop',             keywords: ['pop'] },
  { family: 'Indie',           keywords: ['indie', 'alternative', 'bedroom', 'dream pop'] },
  { family: 'Gospel',          keywords: ['gospel', 'christian', 'worship', 'spiritual'] },
];

const FAMILY_ICONS: Record<string, string> = {
  'Hip-Hop': '🎤', 'Pop': '✨', 'Rock': '🎸', 'Electronic': '🎛️',
  'R&B / Soul': '🎵', 'Jazz': '🎺', 'Classical': '🎼', 'Metal': '🤘',
  'Folk / Acoustic': '🪕', 'Country': '🤠', 'Latin': '💃', 'K-Pop / J-Pop': '⭐',
  'Lo-Fi / Chill': '☕', 'Ambient': '🌊', 'Indie': '🌿', 'Gospel': '🙏', 'Other': '🎵',
};

const FAMILY_SUBSTYLES: Record<string, { style: string; keywords: string[] }[]> = {
  'Hip-Hop': [
    { style: 'Trap & Melodic Rap',      keywords: ['trap', 'cloud rap', 'melodic rap', 'pluggnb', 'rage', 'mumble', 'sad rap', 'emo rap', 'soundcloud'] },
    { style: 'Drill',                   keywords: ['drill', 'brooklyn drill', 'ny drill', 'chicago drill', 'uk drill'] },
    { style: 'Boom Bap & Golden Age',   keywords: ['boom bap', 'golden age', 'old school', 'gangsta rap', 'g-funk', 'west coast rap', 'east coast', 'new york hip hop'] },
    { style: 'Conscious & Underground', keywords: ['conscious', 'underground hip hop', 'alternative hip hop', 'indie rap', 'jazz rap', 'abstract'] },
    { style: 'Southern & Regional',     keywords: ['dirty south', 'crunk', 'snap', 'houston rap', 'chopped', 'memphis rap', 'hyphy', 'bay area'] },
    { style: 'UK Rap & Grime',          keywords: ['grime', 'uk hip hop', 'uk rap', 'afroswing', 'uk trap', 'uk drill'] },
  ],
  'Pop': [
    { style: 'Bedroom & Indie Pop',     keywords: ['bedroom pop', 'indie pop', 'lo-fi pop', 'jangle pop'] },
    { style: 'Dream Pop & Art Pop',     keywords: ['dream pop', 'art pop', 'chamber pop', 'baroque pop', 'experimental pop', 'psychedelic pop'] },
    { style: 'Synth & Electropop',      keywords: ['synth-pop', 'synth pop', 'electropop', 'dance pop', 'new wave pop'] },
    { style: 'Dark & Alt Pop',          keywords: ['dark pop', 'alternative pop', 'sad pop', 'melancholic pop'] },
    { style: 'Hyperpop',                keywords: ['hyperpop', 'pc music', 'bubblegum bass', 'glitch pop'] },
    { style: 'Mainstream Pop',          keywords: ['teen pop', 'adult contemporary', 'europop', 'power pop'] },
  ],
  'Rock': [
    { style: 'Classic & Hard Rock',     keywords: ['classic rock', 'hard rock', 'arena rock', 'psychedelic rock', 'blues rock', 'southern rock'] },
    { style: 'Alternative & Grunge',    keywords: ['alternative rock', 'grunge', 'post-grunge', 'britpop', 'noise rock', 'alt-rock'] },
    { style: 'Indie & Garage',          keywords: ['indie rock', 'garage rock', 'post-punk revival', 'lo-fi rock'] },
    { style: 'Post-Rock & Shoegaze',    keywords: ['post-rock', 'shoegaze', 'math rock', 'space rock', 'slowcore', 'dream pop'] },
    { style: 'Emo & Post-Hardcore',     keywords: ['emo', 'pop punk', 'post-hardcore', 'screamo', 'midwest emo'] },
    { style: 'Punk',                    keywords: ['punk', 'hardcore punk', 'new wave', 'power pop punk'] },
  ],
  'Electronic': [
    { style: 'House',                   keywords: ['house', 'deep house', 'tech house', 'chicago house', 'uk garage', 'disco house'] },
    { style: 'Techno & Industrial',     keywords: ['techno', 'industrial', 'minimal techno', 'detroit techno', 'dark techno'] },
    { style: 'Ambient & Drone',         keywords: ['ambient', 'dark ambient', 'drone', 'atmospheric', 'space ambient'] },
    { style: 'Bass & D&B',              keywords: ['dubstep', 'drum and bass', 'dnb', 'jungle', 'bass music', 'breakbeat', 'neurofunk'] },
    { style: 'EDM & Trance',            keywords: ['edm', 'trance', 'progressive house', 'big room', 'future bass', 'hardstyle'] },
    { style: 'Lo-Fi & Chillhop',        keywords: ['lo-fi', 'lofi', 'chillhop', 'lo fi', 'chillwave', 'study'] },
  ],
  'R&B / Soul': [
    { style: 'Classic Soul & Motown',   keywords: ['classic soul', 'motown', 'southern soul', 'deep soul', 'soul blues'] },
    { style: 'Neo Soul',                keywords: ['neo soul', 'indie soul', 'organic soul'] },
    { style: 'Contemporary R&B',        keywords: ['contemporary r&b', 'urban contemporary', 'pop r&b'] },
    { style: 'Alt R&B',                 keywords: ['alternative r&b', 'indie r&b', 'experimental r&b', 'alt-r&b'] },
    { style: 'Funk',                    keywords: ['funk', 'p-funk', 'afrofunk', 'disco funk', 'electro funk'] },
  ],
  'Metal': [
    { style: 'Classic & Doom',          keywords: ['heavy metal', 'doom metal', 'stoner metal', 'sludge metal', 'traditional metal'] },
    { style: 'Death & Black Metal',     keywords: ['death metal', 'black metal', 'deathcore', 'brutal death', 'grindcore', 'blackened'] },
    { style: 'Thrash & Speed',          keywords: ['thrash metal', 'speed metal', 'bay area thrash', 'crossover thrash'] },
    { style: 'Progressive Metal',       keywords: ['progressive metal', 'prog metal', 'djent', 'technical death metal'] },
    { style: 'Metalcore',               keywords: ['metalcore', 'melodic metalcore', 'post-metalcore'] },
    { style: 'Nu-Metal & Alt',          keywords: ['nu-metal', 'alternative metal', 'rap metal', 'groove metal'] },
  ],
  'Jazz': [
    { style: 'Traditional & Swing',     keywords: ['traditional jazz', 'dixieland', 'swing', 'big band', 'bebop', 'hard bop'] },
    { style: 'Cool & Modal Jazz',       keywords: ['cool jazz', 'modal jazz', 'west coast jazz', 'post-bop'] },
    { style: 'Fusion & Acid Jazz',      keywords: ['jazz fusion', 'fusion', 'jazz funk', 'acid jazz', 'nu jazz'] },
    { style: 'Bossa Nova & Vocal',      keywords: ['bossa nova', 'samba jazz', 'vocal jazz', 'latin jazz'] },
    { style: 'Contemporary Jazz',       keywords: ['contemporary jazz', 'smooth jazz', 'chamber jazz'] },
  ],
  'Classical': [
    { style: 'Baroque & Early',         keywords: ['baroque', 'early music', 'renaissance', 'medieval'] },
    { style: 'Romantic & Orchestral',   keywords: ['romantic', 'orchestral', 'symphonic', 'opera', 'chamber'] },
    { style: 'Modern Classical',        keywords: ['contemporary classical', 'modern classical', '20th century classical'] },
    { style: 'Minimalism',              keywords: ['minimalism', 'minimalist', 'drone classical', 'ambient classical'] },
    { style: 'Neoclassical',            keywords: ['neoclassical', 'post-minimalism', 'cinematic classical'] },
  ],
};

const ERA_SIGNALS: { era: string; period: string; keywords: string[] }[] = [
  { era: 'Golden Era',  period: '60s–80s',  keywords: ['classic', 'golden age', 'old school', 'vintage', 'motown', 'soul blues', 'g-funk', 'gangsta rap', 'hard bop', 'baroque', 'romantic', 'swing', 'big band', 'southern rock'] },
  { era: '90s',         period: '1990s',    keywords: ['boom bap', 'east coast', 'west coast rap', 'grunge', 'britpop', 'shoegaze', 'trip hop', 'acid jazz', 'jungle', 'post-grunge', 'alternative rock'] },
  { era: '2000s',       period: '2000s',    keywords: ['crunk', 'snap', 'emo', 'post-rock', 'indie rock', 'nu-metal', 'dirty south', 'hyphy', 'neo soul', 'post-hardcore', 'tech house'] },
  { era: '2010s',       period: '2010s',    keywords: ['trap', 'cloud rap', 'drill', 'mumble', 'edm', 'indie pop', 'bedroom pop', 'dream pop', 'future bass', 'deep house', 'lo-fi', 'uk drill', 'art pop', 'hyperpop'] },
  { era: 'Present',     period: '2018–now', keywords: ['pluggnb', 'rage', 'sad rap', 'emo rap', 'uk trap', 'afroswing', 'melodic rap', 'dark pop', 'phonk'] },
];

const CONTRADICTIONS: { families: [string, string]; label: string; comment: string }[] = [
  { families: ['Classical', 'Metal'],        label: 'The Classically Trained Aggressor',  comment: 'Classical and metal sharing a library. Both are obsessed with complexity, dynamics, and a specific kind of intensity. These are technically the same impulse at different tempos.' },
  { families: ['Classical', 'Hip-Hop'],      label: 'The Lo Baroque Connector',           comment: 'Classical and hip-hop. Both formats are built on structure, sampling, and a need to prove something. The Venn diagram has more overlap than most critics admit.' },
  { families: ['Jazz', 'Metal'],             label: 'The Technical Extremist',             comment: 'Jazz and metal: two genres that gatekeep on musicianship and believe their fans are the only ones who really get it. You sit at the intersection.' },
  { families: ['Jazz', 'Hip-Hop'],           label: 'The Sophisticated Degenerate',        comment: 'Jazz chords and hard drums in the same rotation. You enjoy music that sounds wrong before it sounds right.' },
  { families: ['Lo-Fi / Chill', 'Metal'],   label: 'The Mood-Disordered Curator',         comment: 'Lo-fi at one extreme, metal at the other. Your playlist goes from "gentle rain" to "industrial demolition" with no warning.' },
  { families: ['Ambient', 'Hip-Hop'],        label: 'The Quiet Storm',                     comment: 'Ambient textures and hard hip-hop in the same rotation. Two very different versions of you using the same streaming account.' },
  { families: ['Country', 'Hip-Hop'],        label: 'The Genre Diplomat',                  comment: 'Country and hip-hop. These genres have spent decades in an uncomfortable relationship. You apparently appreciate both sides.' },
  { families: ['Classical', 'R&B / Soul'],   label: 'The Emotional Architect',             comment: 'Classical structures and soul feeling. You want music to have both intellectual architecture and emotional immediacy.' },
  { families: ['K-Pop / J-Pop', 'Metal'],    label: 'The Chaotic Neutral Listener',        comment: 'K-pop and metal — maximum production gloss and maximum production rawness sharing a drive.' },
  { families: ['Folk / Acoustic', 'Electronic'], label: 'The Luddite Futurist',            comment: 'Folk and electronic music side by side. Handmade and machine-made, sitting together without apparent irony.' },
  { families: ['Gospel', 'Hip-Hop'],         label: 'The Sunday / Saturday Split',         comment: 'Gospel and hip-hop in the same library. Both require performers to be completely committed to the bit.' },
  { families: ['Gospel', 'Metal'],           label: 'The Spiritual Aggressor',             comment: 'Gospel and metal — both defined by volume, devotion, and the expectation that you should feel something by the end.' },
];

// ─── Artist roast database ────────────────────────────────────────────────────

const ARTIST_ROASTS: Record<string, string> = {
  'drake':              'Drake. A man who turned being sad in a mansion into an entire genre and then ran that genre for a decade. Your streams are noted.',
  'kendrick lamar':     'Kendrick Lamar. Acceptable. Expected. The Snob approves of this entry in your library.',
  'j. cole':            'J. Cole. You sit in a room, nodding slowly, certain this music is underappreciated by the people around you.',
  'kanye west':         'Kanye West. Complicated in every dimension — politically, sonically, professionally. You have decided the music is separable from everything else. This is a common position.',
  'tyler, the creator': 'Tyler, the Creator. Golf le Fleur. IGOR. Cherry Bomb. You have followed the evolution through its more abrasive phases and you are still here.',
  'frank ocean':        'Frank Ocean. You have refined taste and you know it. The Snob notes that everyone who listens to Frank Ocean also knows they have refined taste.',
  'bad bunny':          'Bad Bunny. Globally dominant. You are either genuinely culturally fluent or the algorithm delivered you here. Either way, you stayed.',
  'lil baby':           'Lil Baby. Trap delivered with emotional consistency. You have found reliability in 808s, and reliability is underrated.',
  'future':             'Future. You use Future as a texture rather than an artist — atmosphere, not listening. That is actually how he would want it.',
  'lil uzi vert':       'Lil Uzi Vert. Somewhere between rock star and rap star, with a $24 million diamond embedded in their forehead as a personal statement.',
  'playboi carti':      'Playboi Carti. The whole is greater than the sum of its parts, and the parts are mostly adlibs delivered at an angle.',
  'metro boomin':       "Metro Boomin. A producer credited as an artist — and correctly so. If it's Metro, you already know.",
  'gunna':              'Gunna. Drip season, permanent edition. You have accepted that fashion is a structural element of the music.',
  'young thug':         'Young Thug. Fashion-forward, melodically inventive, legally complicated. Your rotation contains multitudes.',
  'jack harlow':        'Jack Harlow. The friendly face of mainstream rap. You listen to him unironically, which is fine — the Snob is not above a hook.',
  'juice wrld':         'Juice WRLD. Emo rap maximalist. The feelings were real; the output was relentless. You have continued listening.',
  'xxxtentacion':       'XXXTentacion. Emotionally raw music from a deeply complicated source. The Snob notes the presence.',
  'lil durk':           'Lil Durk. Chicago drill fully evolved into melody. Your taste has a specific geography.',
  'nba youngboy':       'YoungBoy Never Broke Again. Prolific to a genuinely extreme degree. You are either deeply loyal or algorithmically recommended.',
  'cardi b':            'Cardi B. Charisma as a structural element of the music. She is never not performing.',
  'nicki minaj':        'Nicki Minaj. The catalog is real, the longevity is earned, and the technical ability is there if you look for it.',
  'beyoncé':            'Beyoncé. The most thoroughly produced human being in entertainment. You listen to her as an event.',
  'rihanna':            'Rihanna. Iconic and increasingly rare. Every track you have is from a previous era of her career, which is the only era available.',
  'sza':                'SZA. R&B with the edges left rough. Ctrl → SOS — you have been following the evolution.',
  'doja cat':           "Doja Cat. Pop/rap hybrid for people who want genre lines blurred by someone who clearly doesn't care about categories.",
  'olivia rodrigo':     'Olivia Rodrigo. A specific kind of teenager pain that turned out to resonate across age brackets, including yours.',
  'billie eilish':      'Billie Eilish. Bedroom pop as arena spectacle. The whispered vocal is carrying structural weight.',
  'ariana grande':      'Ariana Grande. Technically impressive vocalist in the machine-pop industrial complex.',
  'harry styles':       'Harry Styles. The One Direction pipeline completed. You are either on the journey or you joined mid-album.',
  'ed sheeran':         'Ed Sheeran. Loop pedal. Acoustic guitar. Emotional efficiency. The algorithm loves him and so, apparently, do you.',
  'coldplay':           'Coldplay. Stadium rock for people who cry at sunsets. They have never stopped working and neither have you.',
  'the 1975':           'The 1975. Art pop that wants you to know it is art pop, which you apparently find endearing rather than exhausting.',
  'arctic monkeys':     "Arctic Monkeys. Sheffield to Mars. You've been here since 'R U Mine?' or you came in with Tranquility Base.",
  'radiohead':          "Radiohead. OK Computer is the approved gateway drug of music snobbery. Welcome. The Snob notes your presence.",
  'tame impala':        'Tame Impala. Kevin Parker in a room alone, becoming every genre simultaneously. You listen to this and feel something you describe as profound.',
  'mac miller':         'Mac Miller. The catalog deepened as the years went on. Your relationship with this music is probably personal.',
  'j dilla':            'J Dilla. You are trying to tell me something about yourself, and the Snob respects it.',
  'nas':                "Nas. Illmatic is the answer to most questions. You know the correct answer.",
  'jay-z':              'Jay-Z. Business, man. You appreciate the executive alongside the art.',
  'eminem':             "Eminem. The technical ability is undeniable. You have opinions about the Marshall Mathers LP.",
  'lil wayne':          "Lil Wayne. 'The Best Rapper Alive' for a specific window of time, and you were paying attention.",
  'chance the rapper':  'Chance the Rapper. Gospel hip-hop for optimists. Your library suggests you believe things will work out.',
  'childish gambino':   "Donald Glover, the musician. The Snob is statistically confident you've also watched Atlanta.",
  'mgmt':               "MGMT. 'Kids' is inescapable. Everything after requires more commitment, and you apparently made it.",
  'flume':              'Flume. Melbourne electronic music that arrived exactly when it needed to. You were there.',
  'disclosure':         'Disclosure. UK garage with pop production values. You understand that house music and pop music are the same impulse.',
  'aphex twin':         'Aphex Twin. You either know exactly why this is in your library or you arrived here accidentally and chose to stay.',
  'burial':             'Burial. South London, rain, anonymous. You listen to this as weather.',
  'post malone':        "Post Malone. Genre-fluid sad boy. Tattoos as a personal brand. You've accepted him into your rotation.",
  'the weeknd':         'The Weeknd. Dark pop for people who want to feel brooding without committing to actual darkness.',
  'travis scott':       'Travis Scott. The concert experience reconstructed as an album. You are in Utopia without having left your room.',
  '21 savage':          '21 Savage. Minimalist delivery as a deliberate aesthetic choice. Less is doing significantly more.',
  'asap rocky':         'ASAP Rocky. Fashion hip-hop — the aesthetic is not separate from the music, it is the music.',
  'joey bada$$':        "Joey Bada$$. Boom bap loyalty in an era that didn't reward it. You appreciate the commitment.",
  'schoolboy q':        "Schoolboy Q. TDE's most criminally underrated member in terms of cultural coverage. Your library knows.",
  'vince staples':      'Vince Staples. Lyrically precise, emotionally cold, consistent. You listen to Vince Staples and feel seen.',
  'earl sweatshirt':    "Earl Sweatshirt. The anti-rap rapper. Every bar costs something. You've found this worth the effort.",
  'jpegmafia':          'JPEGMAFIA. Experimental hip-hop made by someone who appears to have beef with the concept of palatability.',
  'denzel curry':       "Denzel Curry. Technical ability plus raw energy. You're not just here for the hooks.",
  'logic':              'Logic. A man who has announced retirement and comeback in equal measure. You are still in the rotation.',
  'nf':                 'NF. Christian hip-hop for people who want the emotional weight without the genre label. You are familiar with this corner.',
};

// ─── Missing genre roasts ─────────────────────────────────────────────────────

const MISSING_GENRE_ROASTS: Record<string, string> = {
  'Jazz':          "Jazz is absent. The most harmonically complex language in Western popular music, and you've declined to engage. The Snob notes this with academic interest.",
  'Classical':     'Classical has zero representation. Four hundred years of organized sound, and none of it made the cut.',
  'Country':       "Country is missing. You've decided the genre doesn't apply to you, which approximately 40% of the listening world would contest.",
  'Folk / Acoustic': "No folk or acoustic music. You require production. Handmade instruments, unprocessed voices — none of that.",
  'Latin':         "Latin music is absent. Several billion people's primary cultural output: not present in your library.",
  'Gospel':        'Gospel is missing — which means you also missed the genre that structurally built soul, R&B, and a significant portion of American popular music.',
  'Metal':         'No metal. You have decided that amplified distortion at volume is not for you. A clean choice.',
  'Electronic':    'Electronic music is absent. You prefer your music to arrive with human fingerprints.',
  'K-Pop / J-Pop': 'K-Pop and J-Pop: not present. You have opted out of the most thoroughly produced music on the planet.',
  'Ambient':       'No ambient music. You require your music to have structure, tempo, and preferably something happening.',
  'Indie':         "Indie is missing. Either you don't know it, you know it too well, or you've specifically decided against it.",
  'Lo-Fi / Chill': "No lo-fi or chillhop. You are not in the business of study playlists or background listening.",
  'R&B / Soul':    'R&B and soul are absent. You have missed the most emotionally direct genre family in the canon.',
  'Hip-Hop':       "Hip-hop is missing. In the current decade, this is genuinely interesting information.",
  'Rock':          "Rock is absent. Guitar-based music: not relevant to you. This represents about sixty years of Western pop history opted out of.",
  'Pop':           "Pop is absent, which means you're either deep in subculture or actively avoiding the charts. Both are a position.",
};

// ─── Analysis types ───────────────────────────────────────────────────────────

interface FamilyCount { family: string; count: number; genres: string[] }

interface GenreAnalysis {
  familyCounts: FamilyCount[];
  totalFamilyCount: number;
  totalFamilies: number;
  dominantFamily: string;
  dominantPct: number;
  variantCount: number;
  isConcentrated: boolean;
  contradiction: typeof CONTRADICTIONS[0] | null;
  totalGenres: number;
}

interface PrimaryAnalysis {
  family: string;
  dominantPct: number;
  substyles: { style: string; genres: string[]; pct: number }[];
  eraSignals: { era: string; period: string }[];
  topArtists: string[];
}

interface SecondaryAnalysis {
  families: FamilyCount[];
  secondaryPct: number;
  totalFamilies: number;
  contradiction: typeof CONTRADICTIONS[0] | null;
  isSparse: boolean;
}

interface GenreProfile {
  family: string;
  pct: number;
  topSubstyle: string;
  topArtists: string[];
  eraHint: string;
  genreCount: number;
}

// ─── Core clustering ──────────────────────────────────────────────────────────

function assignFamily(genre: string): string {
  const lower = genre.toLowerCase();
  for (const { family, keywords } of GENRE_FAMILIES) {
    if (keywords.some(k => lower.includes(k))) return family;
  }
  return 'Other';
}

function buildFamilyCounts(genres: GenreCount[]): FamilyCount[] {
  const m = new Map<string, { count: number; genres: string[] }>();
  for (const { genre, count } of genres) {
    const fam = assignFamily(genre);
    const ex = m.get(fam) ?? { count: 0, genres: [] };
    m.set(fam, { count: ex.count + count, genres: [...ex.genres, genre] });
  }
  return [...m.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .map(([family, { count, genres }]) => ({ family, count, genres }));
}

function analyzeGenres(genres: GenreCount[]): GenreAnalysis {
  if (!genres.length) {
    return { familyCounts: [], totalFamilyCount: 0, totalFamilies: 0, dominantFamily: 'Unknown', dominantPct: 0, variantCount: 0, isConcentrated: true, contradiction: null, totalGenres: 0 };
  }
  const familyCounts = buildFamilyCounts(genres);
  const totalFamilyCount = familyCounts.reduce((s, f) => s + f.count, 0) || 1;
  const totalFamilies = familyCounts.length;
  const dom = familyCounts[0] ?? { family: 'Other', count: 0, genres: [] };
  const dominantPct = Math.round((dom.count / totalFamilyCount) * 100);
  const variantCount = dom.genres.length;
  const isConcentrated = dominantPct > 55 || (totalFamilies <= 2 && variantCount >= 3);

  const sigThreshold = Math.max(2, 0.07 * totalFamilyCount);
  const sigFamilies = new Set(familyCounts.filter(fc => fc.count >= sigThreshold).map(fc => fc.family));
  let contradiction: typeof CONTRADICTIONS[0] | null = null;
  for (const c of CONTRADICTIONS) {
    if (sigFamilies.has(c.families[0]) && sigFamilies.has(c.families[1])) { contradiction = c; break; }
  }

  return { familyCounts, totalFamilyCount, totalFamilies, dominantFamily: dom.family, dominantPct, variantCount, isConcentrated, contradiction, totalGenres: genres.length };
}

function analyzePrimary(ga: GenreAnalysis, genreArtists: { genre: string; artists: string[] }[]): PrimaryAnalysis {
  const { dominantFamily, familyCounts, totalFamilyCount } = ga;
  const primaryFc = familyCounts.find(fc => fc.family === dominantFamily);
  const primaryGenres = primaryFc?.genres ?? [];
  const primaryCount  = primaryFc?.count ?? 0;

  const styleMap = FAMILY_SUBSTYLES[dominantFamily] ?? [];
  const substyleRaw: { style: string; genres: string[]; count: number }[] = styleMap.map(({ style, keywords }) => {
    const matched = primaryGenres.filter(g => {
      const lower = g.toLowerCase();
      return keywords.some(k => lower.includes(k));
    });
    return { style, genres: matched, count: matched.length };
  });

  const matchedSet = new Set(substyleRaw.flatMap(s => s.genres));
  const unmatched = primaryGenres.filter(g => !matchedSet.has(g));
  if (unmatched.length) substyleRaw.push({ style: `General ${dominantFamily}`, genres: unmatched, count: unmatched.length });

  const totalStyleCount = substyleRaw.reduce((s, st) => s + st.count, 0) || 1;
  const substyles = substyleRaw
    .filter(s => s.count > 0)
    .sort((a, b) => b.count - a.count)
    .map(s => ({ style: s.style, genres: s.genres, pct: Math.round((s.count / totalStyleCount) * 100) }));

  const allPrimaryGenreLower = primaryGenres.map(g => g.toLowerCase()).join(' ');
  const eraSignals = ERA_SIGNALS.filter(({ keywords }) =>
    keywords.some(k => allPrimaryGenreLower.includes(k))
  ).map(({ era, period }) => ({ era, period }));

  const artistCounts = new Map<string, number>();
  const primaryGenreSet = new Set(primaryGenres);
  for (const ga of genreArtists) {
    if (!primaryGenreSet.has(ga.genre)) continue;
    for (const artist of ga.artists) {
      artistCounts.set(artist, (artistCounts.get(artist) || 0) + 1);
    }
  }
  const topArtists = [...artistCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name]) => name);

  return {
    family: dominantFamily,
    dominantPct: Math.round((primaryCount / totalFamilyCount) * 100),
    substyles,
    eraSignals,
    topArtists,
  };
}

function analyzeSecondary(ga: GenreAnalysis): SecondaryAnalysis {
  const { dominantFamily, familyCounts, totalFamilyCount } = ga;

  const secondaryFcs = familyCounts.filter(fc => fc.family !== dominantFamily);
  const secondaryCount = secondaryFcs.reduce((s, fc) => s + fc.count, 0);
  const secondaryPct = Math.round((secondaryCount / totalFamilyCount) * 100);
  const isSparse = secondaryPct < 15;

  const secSigThreshold = Math.max(2, 0.07 * secondaryCount);
  const secSigFamilies = new Set(secondaryFcs.filter(fc => fc.count >= secSigThreshold).map(fc => fc.family));
  let contradiction: typeof CONTRADICTIONS[0] | null = null;
  for (const c of CONTRADICTIONS) {
    if (c.families[0] === dominantFamily || c.families[1] === dominantFamily) continue;
    if (secSigFamilies.has(c.families[0]) && secSigFamilies.has(c.families[1])) { contradiction = c; break; }
  }

  return { families: secondaryFcs, secondaryPct, totalFamilies: secondaryFcs.length, contradiction, isSparse };
}

function profileFamily(fc: FamilyCount, totalFamilyCount: number, genreArtists: { genre: string; artists: string[] }[]): GenreProfile {
  const family = fc.family;
  const pct = Math.round((fc.count / totalFamilyCount) * 100);

  const styleMap = FAMILY_SUBSTYLES[family] ?? [];
  let topSubstyle = '';
  let topSubCount = 0;
  for (const { style, keywords } of styleMap) {
    const count = fc.genres.filter(g => keywords.some(k => g.toLowerCase().includes(k))).length;
    if (count > topSubCount) { topSubCount = count; topSubstyle = style; }
  }
  if (!topSubstyle) topSubstyle = `General ${family}`;

  const familyGenreSet = new Set(fc.genres);
  const artistCounts = new Map<string, number>();
  for (const { genre, artists } of genreArtists) {
    if (!familyGenreSet.has(genre)) continue;
    for (const a of artists) artistCounts.set(a, (artistCounts.get(a) || 0) + 1);
  }
  const topArtists = [...artistCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([n]) => n);

  const genreLower = fc.genres.join(' ').toLowerCase();
  const era = ERA_SIGNALS.find(({ keywords }) => keywords.some(k => genreLower.includes(k)));
  const eraHint = era ? era.period : '';

  return { family, pct, topSubstyle, topArtists, eraHint, genreCount: fc.genres.length };
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function extractTopArtists(rareTracks: RareTrack[], limit = 5): string[] {
  const counts = new Map<string, number>();
  for (const t of rareTracks) {
    const parts = (t.artist || '').split(',').map(a => a.trim()).filter(Boolean);
    for (const a of parts) counts.set(a, (counts.get(a) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([n]) => n);
}

function dataYears(stats: Stats): number {
  const s = new Date(stats.meta.window.start);
  const e = new Date(stats.meta.window.end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
  return Math.max(0, Math.round((e.getTime() - s.getTime()) / (365.25 * 24 * 3600 * 1000)));
}

function relativeTime(isoStr: string): string {
  const now = Date.now();
  const then = new Date(isoStr).getTime();
  if (isNaN(then)) return '';
  const diffDays = Math.floor((now - then) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

// ─── Roast generators ─────────────────────────────────────────────────────────

function roastLibrary(tracks: number, plays: number, years: number, cohesion: number, variety: number): string {
  const ratio = plays > 0 && tracks > 0 ? +(plays / tracks).toFixed(1) : 1;
  const isObsessive = ratio > 5;
  const isExplorer  = ratio < 1.8;

  const behaviorNote = isObsessive
    ? ` A ${ratio}× play-to-track ratio: you don't just find music — you bond with it. These songs have heard more of your internal monologue than most people in your life.`
    : isExplorer
    ? ` At ${ratio}× plays per track, you consume and move on. You are not here to form attachments.`
    : ` Your ${ratio}× play-to-track ratio suggests someone who revisits favorites without becoming imprisoned by them.`;

  const yrsNote = years > 0 ? ` ${years} year${years > 1 ? 's' : ''} of data on file.` : '';

  if (tracks < 80)   return `${tracks.toLocaleString()} unique tracks. Is this a music library or a Post-It note?${yrsNote}${behaviorNote}`;
  if (tracks < 250)  return `${tracks.toLocaleString()} tracks, ${plays.toLocaleString()} plays. Intimate and focused — cohesion ${cohesion}/100 confirms the instinct.${yrsNote}${behaviorNote}`;
  if (tracks < 600)  return `${tracks.toLocaleString()} tracks, ${plays.toLocaleString()} plays. Variety ${variety}/100, cohesion ${cohesion}/100. You know what you like. Whether that's taste or stubbornness is what we're here to determine.${yrsNote}${behaviorNote}`;
  if (tracks < 1500) return `${tracks.toLocaleString()} tracks, ${plays.toLocaleString()} plays. A library with opinions. Variety ${variety}/100 — the question is whether those opinions were formed or inherited.${yrsNote}${behaviorNote}`;
  if (tracks < 4000) return `${tracks.toLocaleString()} tracks, ${plays.toLocaleString()} plays. Variety ${variety}/100, cohesion ${cohesion}/100. The tension between those two numbers tells me more about you than your bio would.${yrsNote}${behaviorNote}`;
  return `${tracks.toLocaleString()} tracks. ${plays.toLocaleString()} plays. This is not a library — it is a condition. A monument to accumulated listening that now requires formal analysis.${yrsNote}${behaviorNote}`;
}

function roastRecent(
  recentTracks: { name: string; artist: string; genres: string[]; playedAt: string }[],
  primaryFamily: string,
): string {
  if (recentTracks.length === 0) {
    return "Your recent listening data isn't detailed enough to decode. You're either very private or you've found a way to listen without leaving timestamps. The Snob is impressed either way.";
  }

  // Find dominant recent family
  const recentFamilyCounts = new Map<string, number>();
  for (const t of recentTracks) {
    for (const g of t.genres) {
      const fam = assignFamily(g);
      recentFamilyCounts.set(fam, (recentFamilyCounts.get(fam) || 0) + 1);
    }
  }
  const topRecent = [...recentFamilyCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const recentFamily = topRecent ? topRecent[0] : primaryFamily;
  const recentArtists = [...new Set(recentTracks.slice(0, 5).map(t => t.artist))].filter(Boolean);

  const shiftNote = recentFamily !== primaryFamily && recentFamily !== 'Other'
    ? ` Interesting shift — your overall library is dominated by ${primaryFamily}, but lately you've been running ${recentFamily}. Something changed, or someone changed it.`
    : ` Consistent with your overall ${primaryFamily} profile — no surprises in the recent rotation.`;

  const artistNote = recentArtists.length > 0
    ? ` Current rotation includes ${recentArtists.slice(0, 3).join(', ')}.`
    : '';

  const mostRecent = recentTracks[0];
  const recencyNote = mostRecent
    ? ` Most recent play: "${mostRecent.name}" by ${mostRecent.artist}${mostRecent.playedAt ? ` (${relativeTime(mostRecent.playedAt)})` : ''}.`
    : '';

  return `Your last ${recentTracks.length} plays analyzed.${recencyNote}${artistNote}${shiftNote}`;
}

const PRIMARY_SUBSTYLE_ROASTS: Record<string, Record<string, string>> = {
  'Hip-Hop': {
    'Trap & Melodic Rap':      'Trap-dominant. The 808 is load-bearing infrastructure in your library. You live in the post-Lex Luger era where production is the argument.',
    'Drill':                   'Drill-heavy. Your hip-hop has a specific texture: minimal, dark, structured around production that implies something serious is always about to happen.',
    'Boom Bap & Golden Age':   "Boom bap and golden age heavy. You went looking for the era before the era. The bars matter. The sample matters. The pause between syllables matters to you.",
    'Conscious & Underground': 'Conscious and underground heavy. You are here for the concept album, the political bar, the wordplay that requires re-listening. You are not here for the club.',
    'Southern & Regional':     "Southern and regional hip-hop. You understand that the genre didn't live in New York alone — it moved through Atlanta, Houston, Memphis, and the Bay, and you followed.",
    'UK Rap & Grime':          "Grime and UK rap. You've crossed the Atlantic for your hip-hop. The BPM is different, the slang is different, the politics are different. You found something there.",
    'General Hip-Hop':         "Your hip-hop sub-genre distribution is broad. You're not loyal to any particular school — you move through eras and scenes without settling.",
  },
  'Pop': {
    'Bedroom & Indie Pop':     'Bedroom pop heavy. You prefer your pop handmade and slightly rough around the edges. The intimacy of a voice recorded close to a cheap microphone, shaped into something.',
    'Dream Pop & Art Pop':     'Dream pop and art pop dominant. You listen to pop as if it were a texture rather than a song — immersive, layered, more interested in feeling than in verse-chorus-verse.',
    'Synth & Electropop':      "Synth and electropop dominant. You prefer your pop architectural — built out of synthesis rather than acoustic warmth. There's a geometry to what you like.",
    'Dark & Alt Pop':          'Dark pop heavy. You want your pop to cost something emotionally. The hook needs to hurt a little. The production should feel like it is holding something back.',
    'Hyperpop':                'Hyperpop. You have moved beyond conventional pop palatability into something that could only exist in a streaming era with no A&R gatekeeping.',
    'Mainstream Pop':          "Mainstream pop dominant. You have no particular interest in defending your taste because it doesn't need defending. Pop exists because it works.",
    'General Pop':             "Your pop listening is spread broadly across the genre's many sub-schools. You have not committed to a specific pop philosophy, which may itself be a philosophy.",
  },
  'Rock': {
    'Classic & Hard Rock':     'Classic and hard rock dominant. You have either inherited this taste or arrived at it independently, and either way it means something about how guitars should sound.',
    'Alternative & Grunge':    "Alternative and grunge heavy. You're in the decade when rock had a sustained argument with itself about what it was supposed to be. You found that argument worth keeping.",
    'Indie & Garage':          'Indie and garage rock. Low-fi by philosophy, not necessity. You prefer your rock to sound like it was made in a hurry by people who had something to prove.',
    'Post-Rock & Shoegaze':    "Post-rock and shoegaze. You listen to rock as atmosphere — long-form, textural, frequently wordless. The guitar is not a riff delivery system. It's a weather system.",
    'Emo & Post-Hardcore':     'Emo and post-hardcore. You have a relationship with emotional specificity in music that many people find uncomfortable. The Snob does not find it uncomfortable.',
    'Punk':                    'Punk. You want your rock short, fast, and structurally unimpressed with its own existence. The three-chord political statement remains underrated as a format.',
    'General Rock':            "Your rock sub-genre spread is broad — you haven't settled into a single school. You are sampling the full argument.",
  },
  'Electronic': {
    'House':                   "House dominant. You understand that the four-on-the-floor is the fundamental unit of electronic music, and you've committed to the genre that never stopped believing this.",
    'Techno & Industrial':     'Techno and industrial heavy. You prefer your electronic music to feel like machinery — purposeful, repetitive, and slightly threatening.',
    'Ambient & Drone':         'Ambient and drone. You listen to electronic music as environment, not entertainment. You want to be inside the sound rather than listening to it.',
    'Bass & D&B':              "Bass music and drum & bass. You are loyal to the energy of sub-bass frequencies and rhythmic complexity that the genre's detractors describe as 'too fast.' They are wrong.",
    'EDM & Trance':            'EDM and trance heavy. You listen to music that is engineered specifically to produce an emotional response, which is honest in a way most genres will not admit.',
    'Lo-Fi & Chillhop':        'Lo-fi and chillhop. You use electronic music as environmental temperature control — something that makes the space feel inhabited.',
    'General Electronic':      "Your electronic listening doesn't settle into one scene. You're moving across the genre's many schools without a fixed address.",
  },
};

function roastPrimary(primary: PrimaryAnalysis): string {
  const { family, dominantPct, substyles, eraSignals, topArtists } = primary;
  const top = substyles[0];

  const familyRoasts = PRIMARY_SUBSTYLE_ROASTS[family];
  const subStyleLine = familyRoasts?.[top?.style ?? '']
    ?? familyRoasts?.[`General ${family}`]
    ?? `Your ${family} listening is spread across ${substyles.length} sub-styles without a clear dominant school.`;

  let eraLine = '';
  if (eraSignals.length >= 3) {
    eraLine = ` Era-wise, you span the ${eraSignals.map(e => e.period).join(', ')} — not loyal to any single moment in the genre's history.`;
  } else if (eraSignals.length === 2) {
    eraLine = ` Your listening sits between the ${eraSignals[0].period} and ${eraSignals[1].period} — cross-generational, if intentional.`;
  } else if (eraSignals.length === 1) {
    eraLine = ` The sub-genre composition skews toward the ${eraSignals[0].period}.`;
  }

  const mixNote = substyles.length >= 3
    ? ` You spread across ${substyles.length} sub-styles: ${substyles.slice(0, 3).map(s => `${s.style} (${s.pct}%)`).join(', ')}.`
    : top
    ? ` ${top.style} accounts for ${top.pct}% of your ${family} listening.`
    : '';

  const artistLine = topArtists.length > 0
    ? ` ${topArtists.slice(0, 2).join(' and ')} keep appearing in this corner of your library.`
    : '';

  return `${subStyleLine}${mixNote}${eraLine}${artistLine}`;
}

function roastGenreDNA(profiles: GenreProfile[], totalFamilies: number): string {
  if (!profiles.length) return 'Genre data insufficient for a full assessment.';

  const topPct    = profiles[0]?.pct ?? 0;
  const secondPct = profiles[1]?.pct ?? 0;
  const topFam    = profiles[0]?.family ?? '';

  if (totalFamilies <= 2) {
    return `Two genre families, total. You have not wandered far from where you started. The Snob notes ${topFam} as a permanent address, not just a preference.`;
  }
  if (totalFamilies >= 7) {
    return `${totalFamilies} genre families in active rotation. You collect musical passport stamps. The breadth is real — whether each visit is substantive is the follow-up question.`;
  }
  if (topPct > 65) {
    const rest = profiles.slice(1).map(p => p.family).join(', ');
    return `${topFam} accounts for ${topPct}% of your library. ${rest.length ? `The remaining entries — ${rest} — are decorative.` : ''} You know what you are, and so does the algorithm.`;
  }
  if (topPct < 40 && totalFamilies >= 4) {
    return `No family breaks 40%. ${profiles.slice(0, 4).map(p => `${p.family} (${p.pct}%)`).join(', ')}. Genuinely omnivorous. The algorithm doesn't know what to recommend next. The Snob considers this the correct outcome.`;
  }
  return `${topFam} leads at ${topPct}%, followed by ${profiles[1]?.family ?? 'silence'} at ${secondPct}%. ${totalFamilies} families in total. A library with a dominant voice and a supporting cast — structured, not random.`;
}

function roastTasteGaps(missingFamilies: string[], totalPresent: number): string {
  if (missingFamilies.length === 0) {
    return 'Every genre family has at least some representation in your library. Either you are genuinely omnivorous, or you have been algorithmically steered into a wide enough net.';
  }
  if (missingFamilies.length >= 10) {
    return `${missingFamilies.length} genre families are completely absent from your library. You are a highly focused listener. The Snob is noting that focus as a lifestyle, not just a preference.`;
  }
  const highlighted = missingFamilies.slice(0, 2);
  const roasts = highlighted.map(f => MISSING_GENRE_ROASTS[f] ?? `${f} is absent from your library.`);
  const moreNote = missingFamilies.length > 2 ? ` ${missingFamilies.length - 2} other families also have zero tracks.` : '';
  return `${roasts.join(' ')}${moreNote} You have ${totalPresent} active genre families. The rest of the map is blank.`;
}

function roastArtistReckoning(
  topArtists: { artist: string; trackCount: number; playCount: number; avgPop: number; topTrack: string }[],
): string {
  if (!topArtists.length) {
    return "Artist data is thin in this dataset. You're either listening anonymously or your playlists are structured in a way that resists attribution. The Snob is suspicious.";
  }

  const top = topArtists[0];
  const key = top.artist.toLowerCase().replace(/\./g, '').trim();
  const specificRoast = ARTIST_ROASTS[key];

  const leadLine = specificRoast
    ? specificRoast
    : top.avgPop >= 80
    ? `${top.artist} — mainstream enough that most people in your life have an opinion about them. ${top.trackCount} tracks in your library. You are committed.`
    : top.avgPop >= 55
    ? `${top.artist} — radio-adjacent. They have had moments the algorithm has acknowledged. ${top.trackCount} tracks.`
    : top.avgPop >= 30
    ? `${top.artist} — genuine mid-tier obscurity. Pop score ${top.avgPop}. Not handed to you.`
    : `${top.artist} — pop score ${top.avgPop}. This name requires explanation at most dinner parties. ${top.trackCount} tracks. You are invested.`;

  const runner = topArtists[1];
  const runnerNote = runner
    ? ` ${runner.artist} follows with ${runner.trackCount} tracks — ${runner.avgPop >= 70 ? 'mainstream adjacency continues' : 'underground loyalty continues'}.`
    : '';

  return `${leadLine}${runnerNote} Your top artist accounts for ${top.trackCount} tracks. That is not a casual relationship.`;
}

type VibeType = { label: string; emoji: string; roast: string };

function computeVibe(energy: number, valence: number, dance: number, acoustic: number, instrumental: number): VibeType {
  const e = Math.round(energy * 100), v = Math.round(valence * 100),
        d = Math.round(dance * 100),  a = Math.round(acoustic * 100),
        ins = Math.round(instrumental * 100);

  if (a > 55 && ins > 25)
    return { label: 'The Instrumental Purist', emoji: '🎼', roast: `Acousticness ${a}%, instrumentalness ${ins}%. You find lyrics distracting. You listen past the vocals to the structure underneath — the tempo, the texture, the space between notes. Either profound musicality or a preference for music that makes no emotional demands.` };
  if (a > 60 && d > 55)
    return { label: 'The Paradox Listener', emoji: '🌀', roast: `Acoustic bias ${a}% but danceability ${d}%. You listen to music that sounds handmade but moves like it wants your body involved. Campfire songs with a pulse. A specific and underrated combination.` };
  if (e > 72 && v > 65)
    return { label: 'The Eternal Optimist', emoji: '🎉', roast: `Energy ${e}%, happiness ${v}%, danceability ${d}%. Relentlessly, unapologetically upbeat. Either genuinely well-adjusted or mastering avoidance through volume. The Snob cannot tell which.` };
  if (e > 72 && v < 38)
    return { label: 'The Focused Aggressor', emoji: '⚡', roast: `Energy ${e}% but valence only ${v}%. All that intensity without the joy. You're not angry — you're operational. The music fuels something specific.` };
  if (e < 35 && v < 40)
    return { label: 'The Midnight Dweller', emoji: '🌑', roast: `Energy ${e}%, valence ${v}%. You listen to music as a companion in whatever you're feeling — not an escape from it. Acoustic bias ${a}% confirms you want it to sound like a deliberate, human act.` };
  if (e < 35 && v > 62)
    return { label: 'The Gentle Optimist', emoji: '🌿', roast: `Low energy (${e}%), high happiness (${v}%), danceability ${d}%. Soft, pleasant, unhurried — music listened to at a reasonable volume, without alarming anyone. Admirable and slightly suspicious.` };
  if (d > 72 && e > 55)
    return { label: 'The Reluctant Dancer', emoji: '🕺', roast: `Danceability ${d}%, energy ${e}%. Your music wants you to move whether you acknowledge it or not. The score doesn't lie, even if you claim you "just like the beat." The Snob sees you at the back of the room almost moving.` };
  if (e < 50 && d < 45)
    return { label: 'The Contemplative Recluse', emoji: '🪞', roast: `Energy ${e}%, danceability ${d}%, valence ${v}%, acoustic bias ${a}%. You don't listen to music — you consider it. Probably while staring at something mid-distance.` };
  return { label: 'The Balanced Listener', emoji: '⚖️', roast: `Energy ${e}%, valence ${v}%, danceability ${d}%, acoustic bias ${a}%. Calibrated across every axis. Either admirable evenhandedness or no strong opinions whatsoever.` };
}

function roastVerdict(
  pr: { rarityScore: number; cohesion: number; variety: number; creativity: number; overall: number },
  snob: string,
  totalFamilies: number,
  missingCount: number,
): string {
  const { rarityScore, cohesion, variety, creativity, overall } = pr;

  let opener: string;
  if (rarityScore >= 70 && cohesion >= 70)
    opener = `Rarity ${rarityScore}, cohesion ${cohesion}. A focused underground library — you've found a specific corner of the obscure and made a home there.`;
  else if (rarityScore >= 70 && variety >= 60)
    opener = `Rarity ${rarityScore}, variety ${variety}. Obscure and wide-ranging. You've discovered a lot of music other people haven't across multiple genre families.`;
  else if (rarityScore < 35 && cohesion >= 70)
    opener = `Rarity ${rarityScore}, cohesion ${cohesion}. Mainstream and focused. You know what you like and what you like is also what most people like.`;
  else if (rarityScore >= 50 && cohesion < 40)
    opener = `Rarity ${rarityScore} but cohesion only ${cohesion}. Underground credentials with no particular theme — you follow instincts across whatever you find.`;
  else if (creativity >= 70)
    opener = `Creativity score ${creativity} — your highest metric. You cross genres and discover artists in ways that resist categorization.`;
  else if (rarityScore >= 55)
    opener = `Rarity score ${rarityScore}. Solid underground credentials without disappearing into total obscurity.`;
  else
    opener = `Rarity score ${rarityScore}. The algorithm has your address. Your streaming data is probably in a Spotify trend report somewhere.`;

  const varietyNote = totalFamilies >= 6
    ? ` ${totalFamilies} active genre families — genuine breadth.`
    : missingCount >= 8
    ? ` Only ${totalFamilies} genre families active — focused by design or by default.`
    : '';

  return `${opener}${varietyNote} Overall snob score: ${overall}/100.${snob ? ` ${snob}` : ''}`;
}

// ─── Slide definitions ────────────────────────────────────────────────────────

interface SlideData { id: string; icon: string; category: string; headline: string; subline: string; extra: React.ReactNode; roast: string }

function buildSlides(stats: Stats): SlideData[] {
  const tracks    = stats._counters?.uniqueTracks ?? stats.meta.rows;
  const plays     = stats._counters?.uniquePlays  ?? stats.meta.rows;
  const years     = dataYears(stats);
  const genres    = stats.topUniqueGenres ?? [];
  const rare      = stats.rareTracks ?? [];
  const taste     = stats.taste ?? { avgEnergy: 0.5, avgValence: 0.5, avgDanceability: 0.5, acousticBias: 0.3, instrumentalBias: 0.1 };
  const pr        = stats.playlistRater ?? { rarityScore: 0, cohesion: 0, variety: 0, overall: 0, creativity: 0 };
  const gArtists  = stats.genreArtists ?? [];
  const decBreak  = stats.decadeBreakdown ?? [];
  const recent    = stats.recentTracks ?? [];
  const topArtistsData = stats.topArtists ?? [];

  const avgRarePop = rare.length > 0 ? Math.round(rare.reduce((s, t) => s + t.pop, 0) / rare.length) : 50;

  const ga        = analyzeGenres(genres);
  const primary   = analyzePrimary(ga, gArtists);
  const secondary = analyzeSecondary(ga);
  const vibe      = computeVibe(taste.avgEnergy, taste.avgValence, taste.avgDanceability, taste.acousticBias ?? 0.3, taste.instrumentalBias ?? 0.1);

  const totalFamilyCount = ga.totalFamilyCount || 1;

  // Top 5 genre profiles
  const top5Fcs = ga.familyCounts.slice(0, 5);
  const top5Profiles = top5Fcs.map(fc => profileFamily(fc, totalFamilyCount, gArtists));

  // Missing genre families
  const presentFamilies = new Set(ga.familyCounts.map(fc => fc.family));
  const missingFamilies = GENRE_FAMILIES.map(gf => gf.family).filter(f => !presentFamilies.has(f));

  // ── Slide 1: Recent Activity ──────────────────────────────────────────────

  // Figure out dominant recent family from recent tracks
  const recentFamMap = new Map<string, number>();
  for (const t of recent) {
    for (const g of t.genres) {
      const fam = assignFamily(g);
      recentFamMap.set(fam, (recentFamMap.get(fam) || 0) + 1);
    }
  }
  const topRecentFam = [...recentFamMap.entries()].sort((a, b) => b[1] - a[1])[0];
  const recentFamily = topRecentFam?.[0] ?? primary.family;
  const recentIcon   = FAMILY_ICONS[recentFamily] ?? '🎵';
  const recentShift  = recentFamily !== primary.family && recentFamily !== 'Other';

  const slide1: SlideData = {
    id: 'recent', icon: recentShift ? '🔄' : '🕐', category: 'LATELY',
    headline: recentShift ? `${recentFamily} Phase` : `${primary.family} As Always`,
    subline: recent.length > 0 ? `Last ${recent.length} plays decoded` : 'Recent activity window',
    extra: (
      <div style={{ width: '100%', maxWidth: 460, margin: '8px auto' }}>
        {recent.length > 0 ? (
          <>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>{recentIcon}</span>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>Current mode</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>{recentFamily}{recentShift ? <span style={{ marginLeft: 8, fontSize: 11, color: '#f093fb', fontWeight: 600 }}>← shift from usual</span> : null}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recent.slice(0, 5).map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: i === 0 ? 700 : 500, fontSize: 13, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.name || 'Unknown Track'}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.artist}{t.genres[0] ? ` · ${t.genres[0]}` : ''}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
                    {relativeTime(t.playedAt)}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic', padding: '16px 0' }}>
            No recent play timestamps in this dataset
          </div>
        )}
      </div>
    ),
    roast: roastRecent(recent, primary.family),
  };

  // ── Slide 2: Library ──────────────────────────────────────────────────────
  const slide2: SlideData = {
    id: 'library', icon: '📼', category: 'THE ARCHIVE',
    headline: `${tracks.toLocaleString()} unique tracks`,
    subline: `${plays.toLocaleString()} plays${years > 0 ? ` · ${years} year${years > 1 ? 's' : ''} of data` : ''}`,
    extra: (
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', margin: '8px 0' }}>
        {[
          { label: 'Unique Tracks', value: tracks.toLocaleString() },
          { label: 'Total Plays',   value: plays.toLocaleString() },
          { label: 'Plays / Track', value: `${(plays / Math.max(tracks, 1)).toFixed(1)}×` },
          { label: 'Cohesion',      value: `${pr.cohesion}/100` },
          { label: 'Variety',       value: `${pr.variety}/100` },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14, padding: '14px 20px', textAlign: 'center', minWidth: 90 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
          </div>
        ))}
      </div>
    ),
    roast: roastLibrary(tracks, plays, years, pr.cohesion, pr.variety),
  };

  // ── Slide 3: Primary Genre Deep Dive ──────────────────────────────────────
  const topSubstyle = primary.substyles[0];
  const slide3: SlideData = {
    id: 'primary', icon: '🔬', category: `${primary.family.toUpperCase()} — THE DEEP DIVE`,
    headline: topSubstyle ? topSubstyle.style : `${primary.family} Dominant`,
    subline: `${primary.dominantPct}% of your library · ${primary.substyles.length} sub-styles detected`,
    extra: (
      <div style={{ width: '100%', maxWidth: 420, margin: '8px auto' }}>
        {primary.substyles.slice(0, 5).map((s, i) => (
          <div key={s.style} style={{ marginBottom: 11 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: i === 0 ? 700 : 500, color: i === 0 ? 'white' : 'rgba(255,255,255,0.7)' }}>
                {s.style}
                <span style={{ marginLeft: 8, fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>
                  {s.genres.slice(0, 2).join(', ')}{s.genres.length > 2 ? ` +${s.genres.length - 2}` : ''}
                </span>
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: i === 0 ? '#667eea' : 'rgba(255,255,255,0.45)' }}>{s.pct}%</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${s.pct}%`, background: i === 0 ? 'linear-gradient(90deg,#667eea,#764ba2)' : `rgba(255,255,255,${0.22 - i * 0.03})`, borderRadius: 3, transition: 'width 0.8s ease' }} />
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
          {primary.eraSignals.length > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Era influences</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                {primary.eraSignals.slice(0, 3).map(e => (
                  <span key={e.era} style={{ fontSize: 11, background: 'rgba(102,126,234,0.2)', border: '1px solid rgba(102,126,234,0.4)', borderRadius: 20, padding: '3px 10px', color: '#a5b4fc', fontWeight: 600 }}>{e.period}</span>
                ))}
              </div>
            </div>
          )}
          {primary.topArtists.length > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Key artists</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
                {primary.topArtists.slice(0, 3).join(' · ')}
              </div>
            </div>
          )}
        </div>
      </div>
    ),
    roast: roastPrimary(primary),
  };

  // ── Slide 4: Genre DNA — Top 5 ────────────────────────────────────────────
  const slide4: SlideData = {
    id: 'genredna', icon: '🧬', category: 'YOUR GENRE DNA',
    headline: `${ga.totalFamilies} Genre Famil${ga.totalFamilies === 1 ? 'y' : 'ies'}`,
    subline: `Top ${Math.min(5, top5Profiles.length)} assessed across sub-styles, eras & artists`,
    extra: (
      <div style={{ width: '100%', maxWidth: 460, margin: '8px auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {top5Profiles.map((p, i) => (
          <div key={p.family} style={{ display: 'flex', alignItems: 'center', gap: 12, background: i === 0 ? 'rgba(102,126,234,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${i === 0 ? 'rgba(102,126,234,0.35)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, padding: '10px 14px' }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{FAMILY_ICONS[p.family] ?? '🎵'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: i === 0 ? 'white' : 'rgba(255,255,255,0.8)' }}>{p.family}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: i === 0 ? '#667eea' : 'rgba(255,255,255,0.4)', flexShrink: 0, marginLeft: 8 }}>{p.pct}%</span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.topSubstyle}
                {p.topArtists.length > 0 && <span style={{ color: 'rgba(255,255,255,0.3)' }}> · {p.topArtists.join(', ')}</span>}
                {p.eraHint && <span style={{ color: 'rgba(102,126,234,0.7)' }}> · {p.eraHint}</span>}
              </div>
            </div>
          </div>
        ))}
        {decBreak.length > 0 && (
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, textAlign: 'center' }}>Release era across all library</div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              {decBreak.filter(d => d.pct >= 3).sort((a, b) => b.pct - a.pct).slice(0, 5).map(d => (
                <div key={d.decade} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 10px', minWidth: 48 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>{d.pct}%</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{d.decade}s</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    ),
    roast: roastGenreDNA(top5Profiles, ga.totalFamilies),
  };

  // ── Slide 5: Taste Gaps ───────────────────────────────────────────────────
  const slide5: SlideData = {
    id: 'gaps', icon: '🕳️', category: 'WHAT\'S MISSING',
    headline: missingFamilies.length === 0 ? 'No Blind Spots' : `${missingFamilies.length} Genre${missingFamilies.length !== 1 ? 's' : ''} Absent`,
    subline: missingFamilies.length === 0 ? 'Every genre family has a foothold' : `${ga.totalFamilies} of ${GENRE_FAMILIES.length} families active`,
    extra: (
      <div style={{ width: '100%', maxWidth: 460, margin: '8px auto' }}>
        {missingFamilies.length > 0 ? (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center', marginBottom: 14 }}>
              {missingFamilies.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '5px 12px', opacity: 0.7 }}>
                  <span style={{ fontSize: 14, filter: 'grayscale(1)' }}>{FAMILY_ICONS[f] ?? '🎵'}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through' }}>{f}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center', fontStyle: 'italic' }}>
              These genre families have zero tracks in your library
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center' }}>
            {GENRE_FAMILIES.map(gf => (
              <div key={gf.family} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 20, padding: '5px 12px' }}>
                <span style={{ fontSize: 14 }}>{FAMILY_ICONS[gf.family] ?? '🎵'}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{gf.family}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    roast: roastTasteGaps(missingFamilies, ga.totalFamilies),
  };

  // ── Slide 6: Artist Reckoning ─────────────────────────────────────────────
  const displayArtists = topArtistsData.length > 0 ? topArtistsData : [];
  const slide6: SlideData = {
    id: 'artists', icon: '🎤', category: 'THE ARTIST RECKONING',
    headline: displayArtists[0]?.artist ? `${displayArtists[0].artist} & ${displayArtists.length - 1} others` : 'Your Most Played',
    subline: `Top ${Math.min(displayArtists.length, 6)} artists by track count`,
    extra: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, alignItems: 'center', margin: '8px 0', width: '100%' }}>
        {displayArtists.length > 0 ? displayArtists.slice(0, 6).map((a, i) => {
          const key = a.artist.toLowerCase().replace(/\./g, '').trim();
          const hasRoast = !!ARTIST_ROASTS[key];
          return (
            <div key={a.artist} style={{ display: 'flex', alignItems: 'center', gap: 12, background: i === 0 ? 'rgba(240,147,251,0.1)' : 'rgba(255,255,255,0.06)', border: `1px solid ${i === 0 ? 'rgba(240,147,251,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, padding: '10px 16px', width: '100%', maxWidth: 400 }}>
              <span style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: i === 0 ? 'linear-gradient(135deg,#f093fb,#f5576c)' : 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'white' }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: i === 0 ? 700 : 500, fontSize: 14, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.artist}</span>
                  {hasRoast && <span style={{ fontSize: 9, background: 'rgba(240,147,251,0.2)', color: '#f093fb', borderRadius: 4, padding: '1px 5px', flexShrink: 0, fontWeight: 700 }}>NOTED</span>}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                  {a.trackCount} tracks · pop {a.avgPop}
                  {a.topTrack ? <span style={{ color: 'rgba(255,255,255,0.25)' }}> · "{a.topTrack.slice(0, 22)}{a.topTrack.length > 22 ? '…' : ''}"</span> : null}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: a.avgPop >= 70 ? '#fbbf24' : a.avgPop >= 40 ? '#60a5fa' : '#a78bfa', fontWeight: 700 }}>
                  {a.avgPop >= 70 ? 'MAINSTREAM' : a.avgPop >= 40 ? 'MID-TIER' : 'UNDERGROUND'}
                </div>
              </div>
            </div>
          );
        }) : <div style={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', padding: '12px 0' }}>No artist data available</div>}
      </div>
    ),
    roast: roastArtistReckoning(displayArtists),
  };

  // ── Slide 7: Vibe ─────────────────────────────────────────────────────────
  const pct = (n: number) => Math.round(n * 100);
  const meters = [
    { label: 'Energy',        value: pct(taste.avgEnergy),        color: '#f5576c' },
    { label: 'Happiness',     value: pct(taste.avgValence),        color: '#667eea' },
    { label: 'Danceability',  value: pct(taste.avgDanceability),   color: '#f093fb' },
    { label: 'Acoustic Bias', value: pct(taste.acousticBias ?? 0), color: '#34d399' },
  ];
  const slide7: SlideData = {
    id: 'vibe', icon: vibe.emoji, category: 'THE VIBE REPORT',
    headline: vibe.label, subline: 'Your audio fingerprint, quantified',
    extra: (
      <div style={{ width: '100%', maxWidth: 380, margin: '8px auto' }}>
        {meters.map(m => (
          <div key={m.label} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{m.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{m.value}%</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${m.value}%`, background: m.color, borderRadius: 4, transition: 'width 0.8s ease' }} />
            </div>
          </div>
        ))}
      </div>
    ),
    roast: vibe.roast,
  };

  // ── Slide 8: Verdict ──────────────────────────────────────────────────────
  const rarityTier =
    pr.rarityScore >= 75 ? { label: 'Underground Royalty',    color: '#a78bfa' } :
    pr.rarityScore >= 55 ? { label: 'The Niche Devotee',      color: '#60a5fa' } :
    pr.rarityScore >= 35 ? { label: 'The Diplomatic Listener',color: '#34d399' } :
                           { label: 'The Mainstream Citizen', color: '#fbbf24' };
  const slide8: SlideData = {
    id: 'verdict', icon: '⚖️', category: 'THE VERDICT',
    headline: rarityTier.label, subline: `Overall Snob Score: ${pr.overall}/100`,
    extra: (
      <div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', margin: '8px 0' }}>
          {([
            { label: 'Rarity',     value: pr.rarityScore, color: rarityTier.color },
            { label: 'Cohesion',   value: pr.cohesion,    color: '#f093fb' },
            { label: 'Variety',    value: pr.variety,     color: '#667eea' },
            { label: 'Creativity', value: pr.creativity,  color: '#f5576c' },
            { label: 'Overall',    value: pr.overall,     color: '#10b981' },
          ] as { label: string; value: number; color: string }[]).map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.07)', border: `1px solid ${color}40`, borderRadius: 14, padding: '12px 14px', minWidth: 72 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
            </div>
          ))}
        </div>
        {/* Variety summary */}
        <div style={{ marginTop: 10, textAlign: 'center' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
            {ga.totalFamilies} genre famil{ga.totalFamilies === 1 ? 'y' : 'ies'} active · {missingFamilies.length} absent · {ga.totalGenres} genre tags
          </span>
        </div>
      </div>
    ),
    roast: roastVerdict(pr, stats.snob || '', ga.totalFamilies, missingFamilies.length),
  };

  return [slide1, slide2, slide3, slide4, slide5, slide6, slide7, slide8];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SnobRoast({ stats, profile, onComplete }: SnobRoastProps) {
  const slides = useMemo(() => buildSlides(stats), [stats]);
  const total  = slides.length;

  const [index, setIndex]                 = useState(0);
  const [visible, setVisible]             = useState(true);
  const [roastRevealed, setRoastRevealed] = useState(false);
  const transitioning                      = React.useRef(false);

  const safeIndex = Math.min(index, total - 1);
  const slide     = slides[safeIndex];
  const isLast    = safeIndex === total - 1;

  useEffect(() => { setRoastRevealed(false); }, [safeIndex]);
  useEffect(() => { const t = setTimeout(() => setRoastRevealed(true), 800); return () => clearTimeout(t); }, [safeIndex]);

  const advance = useCallback(() => {
    if (isLast) { onComplete(); return; }
    if (transitioning.current) return;
    transitioning.current = true;
    setVisible(false);
    setTimeout(() => { setIndex(i => Math.min(i + 1, total - 1)); setVisible(true); transitioning.current = false; }, 320);
  }, [isLast, onComplete, total]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); advance(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [advance]);

  if (!slide) { onComplete(); return null; }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,rgba(10,10,20,0.97) 0%,rgba(20,10,35,0.97) 100%)', backdropFilter: 'blur(20px)', padding: '24px 20px', overflowY: 'auto' }}>

      {/* Progress dots */}
      <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 10 }}>
        {slides.map((_, i) => (
          <div key={i} style={{ width: i === index ? 20 : 7, height: 7, borderRadius: 4, background: i === index ? '#667eea' : i < index ? 'rgba(102,126,234,0.4)' : 'rgba(255,255,255,0.15)', transition: 'all 0.3s ease' }} />
        ))}
      </div>

      {/* Profile badge */}
      <div style={{ position: 'fixed', top: 20, right: 24, fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>{profile}</div>

      {/* Slide */}
      <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.32s ease, transform 0.32s ease', width: '100%', maxWidth: 620, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.3)', marginBottom: 20, textTransform: 'uppercase', fontWeight: 600 }}>{index + 1} of {total}</div>
        <div style={{ fontSize: 11, letterSpacing: 3, color: '#667eea', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>{slide.category}</div>
        <div style={{ fontSize: 56, lineHeight: 1, margin: '4px 0 12px', filter: 'drop-shadow(0 0 20px rgba(102,126,234,0.5))' }}>{slide.icon}</div>
        <h2 style={{ margin: '0 0 6px', fontSize: 'clamp(1.3rem,4vw,2rem)', fontWeight: 800, color: 'white', textAlign: 'center', lineHeight: 1.2 }}>{slide.headline}</h2>
        <p style={{ margin: '0 0 20px', color: 'rgba(255,255,255,0.45)', fontSize: 14, textAlign: 'center' }}>{slide.subline}</p>
        <div style={{ width: '100%' }}>{slide.extra}</div>
        <div style={{ width: '100%', height: 1, background: 'linear-gradient(90deg,transparent,rgba(102,126,234,0.4),transparent)', margin: '20px 0' }} />

        {/* Roast bubble */}
        <div style={{ width: '100%', opacity: roastRevealed ? 1 : 0, transform: roastRevealed ? 'translateY(0)' : 'translateY(12px)', transition: 'opacity 0.5s ease, transform 0.5s ease' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#f093fb,#f5576c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginTop: 2, boxShadow: '0 0 16px rgba(240,147,251,0.4)' }}>🎩</div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px 16px 16px 16px', padding: '14px 18px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#f093fb', textTransform: 'uppercase', marginBottom: 6 }}>The Snob</div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,0.85)', fontStyle: 'italic' }}>"{slide.roast}"</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ marginTop: 28, width: '100%', display: 'flex', justifyContent: 'center' }}>
          {isLast ? (
            <button onClick={advance} style={{ padding: '16px 40px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px rgba(102,126,234,0.4)', transition: 'all 0.2s ease', letterSpacing: 0.5 }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(102,126,234,0.55)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(102,126,234,0.4)'; }}>
              Enter The Dashboard →
            </button>
          ) : (
            <button onClick={advance} style={{ padding: '13px 32px', background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease' }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}>
              Next → <span style={{ marginLeft: 10, opacity: 0.4, fontSize: 11 }}>or press Enter</span>
            </button>
          )}
        </div>
      </div>

      {/* Skip */}
      <button onClick={onComplete} style={{ position: 'fixed', bottom: 20, right: 24, background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: 12, cursor: 'pointer', padding: '4px 8px', transition: 'color 0.2s' }}
        onMouseOver={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
        onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.2)'; }}>
        Skip to dashboard →
      </button>
    </div>
  );
}
