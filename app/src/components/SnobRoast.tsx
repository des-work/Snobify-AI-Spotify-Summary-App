import React, { useState, useEffect, useCallback } from 'react';
import type { Stats, RareTrack, GenreCount } from '../types';

interface SnobRoastProps {
  stats: Stats;
  profile: string;
  onComplete: () => void;
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function extractTopArtists(rareTracks: RareTrack[], limit = 5): string[] {
  const counts = new Map<string, number>();
  for (const t of (rareTracks ?? [])) {
    // Artist field can be "A, B, C" — split and count each
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

// ─── Roast generators (the actual content) ────────────────────────────────────

function roastLibrary(tracks: number, plays: number, years: number): string {
  const yrsNote = years > 0 ? ` That's ${years} year${years > 1 ? 's' : ''} of choices, all of which are now my problem.` : '';
  if (tracks < 80)
    return `${tracks.toLocaleString()} unique tracks. Is this a music library or a Post-It note? My grocery list has more variety.${yrsNote}`;
  if (tracks < 250)
    return `${tracks.toLocaleString()} tracks. Intimate. Focused. Suspiciously curated. You don't explore music — you defend it.${yrsNote}`;
  if (tracks < 600)
    return `${tracks.toLocaleString()} tracks with ${plays.toLocaleString()} plays. A respectable collection. You know what you like, which is either taste or stubbornness. I'll give you the benefit of the doubt.${yrsNote}`;
  if (tracks < 1500)
    return `${tracks.toLocaleString()} tracks. Now this is a person with opinions. Whether those opinions are defensible is what we're here to determine.${yrsNote}`;
  if (tracks < 4000)
    return `${tracks.toLocaleString()} tracks, ${plays.toLocaleString()} plays. You've been doing this a while. I respect the commitment even as I reserve judgment on several hundred individual decisions.${yrsNote}`;
  return `${tracks.toLocaleString()} tracks. ${plays.toLocaleString()} plays. This is not a music library — it is a condition. An intervention. A monument to time that cannot be reclaimed.${yrsNote} I need a moment.`;
}

function roastGenres(genres: GenreCount[]): { label: string; roast: string } {
  if (!genres || genres.length === 0)
    return { label: 'The Uncategorisable', roast: "No identifiable genres. Either you listen to things that defy classification, or Spotify's algorithm took one look and quietly gave up. I respect the chaos, if not the curation." };

  const top = genres[0].genre.toLowerCase();
  const count = genres.length;
  const topName = genres[0].genre;

  const genreMap: Array<[string[], { label: string; roast: string }]> = [
    [['pop'], { label: 'The Mainstream Pilgrim', roast: `Your dominant genre is pop — the genre named after its own popularity. You have chosen, consciously or not, to be statistically average. I won't say I'm disappointed. I will say I'm not surprised.` }],
    [['hip-hop', 'hip hop', 'rap', 'trap', 'drill'], { label: 'The Rhythm Devotee', roast: `Hip-hop at the top. The dominant art form of the past thirty years. Your taste is either genuinely excellent or very strategically defensible. Either way, I'll allow it.` }],
    [['indie', 'indie pop', 'indie rock', 'indie folk'], { label: 'The Indie Apologist', roast: `Indie. The genre that means "I have opinions about music" without specifying which ones. You stream from a curated distance, emotionally available but never too on the nose.` }],
    [['rock', 'classic rock', 'alt-rock', 'alternative'], { label: 'The Rock Loyalist', roast: `Rock. You are keeping an entire genre on life support through sheer personal loyalty. Doctors have noted the patient is comfortable.` }],
    [['electronic', 'edm', 'house', 'techno', 'drum and bass', 'dubstep', 'ambient'], { label: 'The Frequency Chaser', roast: `Electronic music — the genre where the DJ gets more credit than the person who invented chords. You don't listen to artists, you listen to *atmospheres*. Or you need something loud enough to stop thinking. Either/or.` }],
    [['r&b', 'rnb', 'soul', 'neo soul'], { label: 'The Soulful Realist', roast: `R&B and soul — music that requires actual emotional intelligence to appreciate. That's a high bar you've apparently cleared. Noted.` }],
    [['jazz'], { label: 'The Jazz Understander', roast: `Jazz. You either genuinely understand it or you put it on when company arrives. There is no middle ground, and I am watching closely.` }],
    [['classical', 'orchestral', 'opera'], { label: 'The Dead Composer Fan', roast: `Classical music. You find comfort in centuries-old notes arranged by people who died before electricity. That's either profound perspective or elaborate avoidance. Possibly both.` }],
    [['metal', 'heavy metal', 'death metal', 'black metal'], { label: 'The Sophisticated Aggressor', roast: `Metal. More technically demanding than it gets credit for, more emotionally nuanced than it looks. You've found catharsis in volume. That's one approach.` }],
    [['lo-fi', 'lo fi', 'chillhop', 'study'], { label: 'The Atmospheric Hermit', roast: `Lo-fi. Background music disguised as taste. You're not listening — you're *existing alongside* music. Comfortable, inoffensive, and slightly suspicious.` }],
    [['folk', 'acoustic', 'singer-songwriter'], { label: 'The Acoustic Purist', roast: `Folk and acoustic. One guitar, one voice, one overwhelming feeling that everyone else is too loud. You're not anti-social — you just have *standards* about sonic textures.` }],
    [['latin', 'reggaeton', 'salsa', 'cumbia'], { label: 'The Rhythmic Cosmopolitan', roast: `Latin music — rhythm, passion, and a complete disregard for your neighbors' reasonable expectation of silence. Excellent priorities.` }],
    [['k-pop', 'j-pop', 'korean', 'japanese'], { label: 'The K-Pop Devotee', roast: `K-pop and J-pop. Commitment to craft, impeccable production, and a parasocial relationship with artists twelve time zones away. A bold and expensive lifestyle choice.` }],
  ];

  for (const [keys, result] of genreMap) {
    if (keys.some(k => top.includes(k))) {
      return {
        ...result,
        roast: result.roast + (count > 5 ? ` The fact that you also dabble in ${count - 1} other genres suggests you haven't fully committed to the bit yet.` : ''),
      };
    }
  }

  return {
    label: 'The Genre Polyglot',
    roast: `Your primary genre is ${topName} — niche enough to mean something, obscure enough to require explanation at parties. You've spread across ${count} genre${count > 1 ? 's' : ''} total. Whether this is eclecticism or indecision is a matter of perspective.`,
  };
}

function roastArtists(artists: string[], avgRarePop: number): string {
  if (artists.length === 0)
    return "The Snob couldn't identify your go-to artists from this dataset. You're either delightfully mysterious or listening to things so obscure they don't have names yet. Both are possible.";

  const top = artists[0];
  const others = artists.slice(1, 4);
  const otherNote = others.length > 0 ? ` ${others.join(', ')} and their associates also keep appearing.` : '';

  if (avgRarePop < 20)
    return `${top} leads your underground roster.${otherNote} These are artists with Spotify popularity scores in the single digits. You haven't discovered music — you've *excavated* it. I am begrudgingly impressed.`;
  if (avgRarePop < 40)
    return `${top} is a recurring presence in your more obscure listening.${otherNote} Genuine underground taste, but accessible enough that you still get invited to parties. A delicate balance.`;
  if (avgRarePop < 60)
    return `${top} anchors your collection.${otherNote} Neither painfully obscure nor embarrassingly mainstream. You've landed in the comfortable middle, which is either pragmatic or a failure of conviction.`;
  return `${top} appears frequently in your rotations.${otherNote} I'll be diplomatic: these are artists other people have also heard of. Your taste is socially legible, which is either a feature or a bug depending on who you ask.`;
}

type VibeType = {
  label: string;
  emoji: string;
  roast: string;
};

function computeVibe(energy: number, valence: number, dance: number): VibeType {
  const e = energy * 100;
  const v = valence * 100;
  const d = dance * 100;

  if (e > 72 && v > 65)
    return { label: 'The Eternal Optimist', emoji: '🎉', roast: `Energy ${Math.round(e)}%, happiness ${Math.round(v)}%, danceability ${Math.round(d)}%. You listen to music the way motivational posters exist — relentlessly, unapologetically upbeat. Either you're genuinely well-adjusted or you've mastered avoidance through movement. Keep dancing.` };

  if (e > 72 && v < 38)
    return { label: 'The Focused Aggressor', emoji: '⚡', roast: `Energy ${Math.round(e)}%, but only ${Math.round(v)}% happiness. All that intensity with none of the joy. You're not angry — you're *operational*. Like a very stressed-out accountant doing cardio. The music fuels you. Whether that's healthy is between you and your therapist.` };

  if (e < 35 && v < 40)
    return { label: 'The Midnight Dweller', emoji: '🌑', roast: `Energy ${Math.round(e)}%, valence ${Math.round(v)}%. You listen to music like it's a companion in your sadness rather than an escape from it. That's either poetic depth or a cry for help. I'm not a licensed professional, so I'll just say: I see you.` };

  if (e < 35 && v > 62)
    return { label: 'The Gentle Optimist', emoji: '🌿', roast: `Low energy, high happiness, ${Math.round(d)}% danceability. Soft, pleasant, unhurried. You listen to music the way most people wish they could live — pleasantly, at a reasonable volume, without alarming anyone.` };

  if (d > 72 && e > 55)
    return { label: 'The Reluctant Dancer', emoji: '🕺', roast: `${Math.round(d)}% danceability. Your music wants you to move whether you acknowledge it or not. That score doesn't lie, even if you claim you 'just like the beat.' We see you at the back of the room almost moving.` };

  if (energy < 50 && dance < 45)
    return { label: 'The Contemplative Recluse', emoji: '🪞', roast: `Low energy, low danceability, ${Math.round(v)}% valence. You don't listen to music — you *consider* it. Probably while staring out a window. Probably with a drink. This is either profound or a personality built around a specific aesthetic. Both are valid.` };

  return { label: 'The Balanced Listener', emoji: '⚖️', roast: `Energy ${Math.round(e)}%, valence ${Math.round(v)}%, danceability ${Math.round(d)}%. Perfectly calibrated across every axis. You've achieved audio equilibrium, which is either admirable taste or the result of no strong opinions whatsoever. I genuinely cannot tell which.` };
}

function roastVerdict(rarityScore: number, overall: number, snob: string): string {
  let opener = '';
  if (rarityScore >= 75)
    opener = `Rarity score ${rarityScore}. You have successfully avoided the mainstream and now inhabit that specific zone between 'genuinely good taste' and 'I'll explain why you haven't heard of them.' The Snob is cautiously approving.`;
  else if (rarityScore >= 55)
    opener = `Rarity score ${rarityScore}. Respectable underground credentials. Not trying too hard, not completely selling out. The comfortable obscurity of someone who has made peace with their own taste.`;
  else if (rarityScore >= 35)
    opener = `Rarity score ${rarityScore}. One foot in what's popular, one foot in 'I found this first.' A diplomatic musical identity — everyone is technically welcome at your listening party.`;
  else
    opener = `Rarity score ${rarityScore}. The algorithm has your address. Your streaming data probably appears in Spotify's trend reports. That's not an insult — mainstream music is mainstream because people like it. You're people.`;

  return `${opener} Overall snob score: ${overall}/100. ${snob}`;
}

// ─── Slide definitions ────────────────────────────────────────────────────────

interface SlideData {
  id: string;
  icon: string;
  category: string;
  headline: string;
  subline: string;
  extra: React.ReactNode;
  roast: string;
}

function buildSlides(stats: Stats): SlideData[] {
  const tracks     = stats._counters?.uniqueTracks ?? stats.meta.rows;
  const plays      = stats._counters?.uniquePlays  ?? stats.meta.rows;
  const years      = dataYears(stats);
  const genres     = stats.topUniqueGenres ?? [];
  const rareTracks = stats.rareTracks ?? [];
  const taste      = stats.taste;
  const pr         = stats.playlistRater;
  const artists    = extractTopArtists(rareTracks);
  const avgRarePop = rareTracks.length > 0
    ? Math.round(rareTracks.reduce((s, t) => s + t.pop, 0) / rareTracks.length)
    : 50;
  const genreRoast = roastGenres(genres);
  const vibe       = computeVibe(taste.avgEnergy, taste.avgValence, taste.avgDanceability);

  // Slide 1 — Library
  const slide1: SlideData = {
    id: 'library',
    icon: '📼',
    category: 'THE ARCHIVE',
    headline: `${tracks.toLocaleString()} unique tracks`,
    subline: `${plays.toLocaleString()} total plays${years > 0 ? ` · ${years} year${years > 1 ? 's' : ''} of data` : ''}`,
    extra: (
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', margin: '8px 0' }}>
        {[
          { label: 'Unique Tracks', value: tracks.toLocaleString() },
          { label: 'Total Plays',   value: plays.toLocaleString() },
          { label: 'Years of Data', value: years > 0 ? `${years}y` : '—' },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 14, padding: '16px 24px', textAlign: 'center', minWidth: 100,
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
          </div>
        ))}
      </div>
    ),
    roast: roastLibrary(tracks, plays, years),
  };

  // Slide 2 — Genres
  const slide2: SlideData = {
    id: 'genres',
    icon: '🎭',
    category: 'THE GENRE IDENTITY',
    headline: genreRoast.label,
    subline: `${genres.length} genre${genres.length !== 1 ? 's' : ''} identified in your library`,
    extra: (
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', margin: '8px 0' }}>
        {genres.slice(0, 6).map((g, i) => (
          <div key={g.genre} style={{
            background: i === 0
              ? 'linear-gradient(135deg,#667eea,#764ba2)'
              : 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 20, padding: '8px 18px',
            fontSize: i === 0 ? 15 : 13,
            fontWeight: i === 0 ? 700 : 500,
            color: 'white',
          }}>
            {i === 0 && '★ '}{g.genre}
            <span style={{ marginLeft: 6, opacity: 0.6, fontSize: 11 }}>{g.count}</span>
          </div>
        ))}
      </div>
    ),
    roast: genreRoast.roast,
  };

  // Slide 3 — Artists
  const slide3: SlideData = {
    id: 'artists',
    icon: '🎤',
    category: 'THE USUAL SUSPECTS',
    headline: artists.length > 0 ? `${artists[0]} & company` : 'A mysterious collection',
    subline: `Artists recurring in your underground rotation`,
    extra: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', margin: '8px 0' }}>
        {artists.length > 0
          ? artists.map((name, i) => (
            <div key={name} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 12, padding: '10px 20px', width: '100%', maxWidth: 360,
            }}>
              <span style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: i === 0 ? 'linear-gradient(135deg,#f093fb,#f5576c)' : 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, color: 'white',
              }}>{i + 1}</span>
              <span style={{ fontWeight: i === 0 ? 700 : 500, fontSize: i === 0 ? 16 : 14, color: 'white' }}>{name}</span>
            </div>
          ))
          : <div style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>No artist data available</div>
        }
      </div>
    ),
    roast: roastArtists(artists, avgRarePop),
  };

  // Slide 4 — Vibe
  const pct = (n: number) => Math.round(n * 100);
  const meters = [
    { label: 'Energy',      value: pct(taste.avgEnergy),       color: '#f5576c' },
    { label: 'Happiness',   value: pct(taste.avgValence),       color: '#667eea' },
    { label: 'Danceability',value: pct(taste.avgDanceability),  color: '#f093fb' },
  ];

  const slide4: SlideData = {
    id: 'vibe',
    icon: vibe.emoji,
    category: 'THE VIBE REPORT',
    headline: vibe.label,
    subline: `Your audio fingerprint, quantified`,
    extra: (
      <div style={{ width: '100%', maxWidth: 380, margin: '8px auto' }}>
        {meters.map(m => (
          <div key={m.label} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{m.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{m.value}%</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${m.value}%`,
                background: m.color, borderRadius: 4,
                transition: 'width 0.8s ease',
              }} />
            </div>
          </div>
        ))}
      </div>
    ),
    roast: vibe.roast,
  };

  // Slide 5 — Verdict
  const rarityTier =
    pr.rarityScore >= 75 ? { label: 'Underground Royalty', color: '#a78bfa' } :
    pr.rarityScore >= 55 ? { label: 'The Niche Devotee',   color: '#60a5fa' } :
    pr.rarityScore >= 35 ? { label: 'The Diplomatic Listener', color: '#34d399' } :
    { label: 'The Mainstream Citizen', color: '#fbbf24' };

  const slide5: SlideData = {
    id: 'verdict',
    icon: '⚖️',
    category: 'THE VERDICT',
    headline: rarityTier.label,
    subline: `Snob Score: ${pr.overall}/100`,
    extra: (
      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', margin: '8px 0' }}>
        {[
          { label: 'Rarity',    value: pr.rarityScore, color: rarityTier.color },
          { label: 'Cohesion',  value: pr.cohesion,    color: '#f093fb' },
          { label: 'Variety',   value: pr.variety,     color: '#667eea' },
          { label: 'Overall',   value: pr.overall,     color: '#10b981' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            textAlign: 'center',
            background: 'rgba(255,255,255,0.07)',
            border: `1px solid ${color}40`,
            borderRadius: 14, padding: '14px 20px', minWidth: 90,
          }}>
            <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
          </div>
        ))}
      </div>
    ),
    roast: roastVerdict(pr.rarityScore, pr.overall, stats.snob),
  };

  return [slide1, slide2, slide3, slide4, slide5];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SnobRoast({ stats, profile, onComplete }: SnobRoastProps) {
  const slides = buildSlides(stats);
  const total  = slides.length;

  const [index, setIndex]           = useState(0);
  const [visible, setVisible]       = useState(true);   // drives the fade
  const [roastRevealed, setRoastRevealed] = useState(false);

  const slide = slides[index];
  const isLast = index === total - 1;

  // Reset roast reveal when slide changes
  useEffect(() => { setRoastRevealed(false); }, [index]);

  // Auto-reveal the roast text 800ms after the slide appears
  useEffect(() => {
    const t = setTimeout(() => setRoastRevealed(true), 800);
    return () => clearTimeout(t);
  }, [index]);

  const advance = useCallback(() => {
    if (isLast) { onComplete(); return; }
    setVisible(false);
    setTimeout(() => {
      setIndex(i => i + 1);
      setVisible(true);
    }, 320);
  }, [isLast, onComplete]);

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [advance]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1200,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, rgba(10,10,20,0.97) 0%, rgba(20,10,35,0.97) 100%)',
      backdropFilter: 'blur(20px)',
      padding: '24px 20px',
      overflowY: 'auto',
    }}>

      {/* Progress dots */}
      <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 10 }}>
        {slides.map((_, i) => (
          <div key={i} style={{
            width: i === index ? 24 : 8, height: 8, borderRadius: 4,
            background: i === index ? '#667eea' : i < index ? 'rgba(102,126,234,0.4)' : 'rgba(255,255,255,0.15)',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>

      {/* Profile badge */}
      <div style={{
        position: 'fixed', top: 20, right: 24,
        fontSize: 12, color: 'rgba(255,255,255,0.35)',
        fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase',
      }}>
        {profile}
      </div>

      {/* Slide content */}
      <div style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.32s ease, transform 0.32s ease',
        width: '100%', maxWidth: 620,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 0,
      }}>

        {/* Counter */}
        <div style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.3)', marginBottom: 20, textTransform: 'uppercase', fontWeight: 600 }}>
          {index + 1} of {total}
        </div>

        {/* Category label */}
        <div style={{
          fontSize: 11, letterSpacing: 3, color: '#667eea',
          textTransform: 'uppercase', fontWeight: 700, marginBottom: 8,
        }}>
          {slide.category}
        </div>

        {/* Icon */}
        <div style={{
          fontSize: 56, lineHeight: 1, margin: '4px 0 12px',
          filter: 'drop-shadow(0 0 20px rgba(102,126,234,0.5))',
        }}>
          {slide.icon}
        </div>

        {/* Headline */}
        <h2 style={{
          margin: '0 0 6px',
          fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
          fontWeight: 800,
          color: 'white',
          textAlign: 'center',
          lineHeight: 1.2,
        }}>
          {slide.headline}
        </h2>

        {/* Subline */}
        <p style={{ margin: '0 0 20px', color: 'rgba(255,255,255,0.45)', fontSize: 14, textAlign: 'center' }}>
          {slide.subline}
        </p>

        {/* Data display */}
        <div style={{ width: '100%' }}>
          {slide.extra}
        </div>

        {/* Divider */}
        <div style={{
          width: '100%', height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(102,126,234,0.4), transparent)',
          margin: '20px 0',
        }} />

        {/* Snob speech bubble */}
        <div style={{
          width: '100%',
          opacity: roastRevealed ? 1 : 0,
          transform: roastRevealed ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}>
          {/* Avatar row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{
              flexShrink: 0, width: 40, height: 40, borderRadius: '50%',
              background: 'linear-gradient(135deg,#f093fb,#f5576c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, marginTop: 2,
              boxShadow: '0 0 16px rgba(240,147,251,0.4)',
            }}>
              🎩
            </div>

            <div style={{
              flex: 1,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '4px 16px 16px 16px',
              padding: '14px 18px',
              position: 'relative',
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: 1,
                color: '#f093fb', textTransform: 'uppercase', marginBottom: 6,
              }}>
                The Snob
              </div>
              <p style={{
                margin: 0, fontSize: 14, lineHeight: 1.65,
                color: 'rgba(255,255,255,0.85)', fontStyle: 'italic',
              }}>
                "{slide.roast}"
              </p>
            </div>
          </div>
        </div>

        {/* CTA button */}
        <div style={{ marginTop: 28, width: '100%', display: 'flex', justifyContent: 'center', gap: 12 }}>
          {isLast ? (
            <button
              onClick={advance}
              style={{
                padding: '16px 40px',
                background: 'linear-gradient(135deg,#667eea,#764ba2)',
                color: 'white', border: 'none', borderRadius: 14,
                fontSize: 16, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(102,126,234,0.4)',
                transition: 'all 0.2s ease',
                letterSpacing: 0.5,
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(102,126,234,0.55)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(102,126,234,0.4)'; }}
            >
              Enter The Dashboard →
            </button>
          ) : (
            <button
              onClick={advance}
              style={{
                padding: '13px 32px',
                background: 'rgba(255,255,255,0.08)',
                color: 'white', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 12, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            >
              Next →
              <span style={{ marginLeft: 10, opacity: 0.4, fontSize: 11 }}>or press Enter</span>
            </button>
          )}
        </div>

      </div>

      {/* Skip link */}
      <button
        onClick={onComplete}
        style={{
          position: 'fixed', bottom: 20, right: 24,
          background: 'none', border: 'none',
          color: 'rgba(255,255,255,0.2)', fontSize: 12,
          cursor: 'pointer', padding: '4px 8px',
          transition: 'color 0.2s',
        }}
        onMouseOver={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
        onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.2)'; }}
      >
        Skip to dashboard →
      </button>
    </div>
  );
}
