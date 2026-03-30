import React, { useState, useEffect } from 'react';

interface WelcomePageProps {
  onGetStarted: () => void;
}

const QUOTES = [
  "Your taste in music says everything. Unfortunately.",
  "Algorithms listen to everyone. We listen to you specifically, and have concerns.",
  "Mainstream is not a genre. It's a warning.",
  "The playlist never lies, even when the listener does.",
  "Your library is a confession. We are reading it.",
  "There are no guilty pleasures — only pleasures you haven't defended yet.",
  "Discovery ends where the algorithm begins.",
  "Good taste is not the absence of bad taste. It is taste that knows itself.",
  "Every skip is a data point. Every repeat is a verdict.",
  "You curated this. We merely hold up the mirror.",
];

const FEATURES = [
  { icon: '🧬', label: 'Genre DNA',         desc: 'Top 5 genres, fully dissected' },
  { icon: '🕐', label: 'Recent Activity',    desc: 'What you\'ve been into lately' },
  { icon: '🔬', label: 'Sub-Style Audit',    desc: 'Beyond surface-level genres' },
  { icon: '🕳️', label: 'Taste Gaps',         desc: 'What\'s missing from your library' },
  { icon: '🎤', label: 'Artist Reckoning',   desc: 'Named, assessed, possibly roasted' },
  { icon: '⚖️', label: 'Snob Score',         desc: 'The final, definitive verdict' },
];

const TICKER_GENRES = [
  'Hip-Hop', 'Jazz', 'Ambient', 'Drill', 'Neo Soul', 'Classical',
  'Trap', 'Indie Rock', 'Techno', 'Lo-Fi', 'R&B', 'Electronic',
  'Post-Rock', 'K-Pop', 'Metal', 'Folk', 'Shoegaze', 'Boom Bap',
  'House', 'Grime', 'Alternative', 'Soul', 'Hyperpop', 'Emo',
];

// Dot grid positions
const DOTS = Array.from({ length: 12 }, (_, row) =>
  Array.from({ length: 18 }, (_, col) => ({ row, col }))
).flat();

export default function WelcomePage({ onGetStarted }: WelcomePageProps) {
  const [quoteIdx, setQuoteIdx]       = useState(0);
  const [quoteVisible, setQuoteVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setQuoteVisible(false);
      setTimeout(() => {
        setQuoteIdx(i => (i + 1) % QUOTES.length);
        setQuoteVisible(true);
      }, 450);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      position: 'relative', minHeight: '100vh', overflow: 'hidden',
      background: 'linear-gradient(160deg, #08081a 0%, #100720 40%, #0e0526 70%, #130a1e 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', color: 'white',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    }}>

      {/* ── Background layer ─────────────────────────────────────── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>

        {/* Colour orbs */}
        <div className="snob-orb-1" style={{
          position: 'absolute', top: '-12%', left: '-8%',
          width: 680, height: 680, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(102,126,234,0.38) 0%, transparent 68%)',
          filter: 'blur(48px)',
        }} />
        <div className="snob-orb-2" style={{
          position: 'absolute', top: '-4%', right: '-12%',
          width: 560, height: 560, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(240,147,251,0.28) 0%, transparent 68%)',
          filter: 'blur(56px)',
        }} />
        <div className="snob-orb-3" style={{
          position: 'absolute', bottom: '-8%', left: '8%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20,184,166,0.18) 0%, transparent 68%)',
          filter: 'blur(48px)',
        }} />
        <div className="snob-orb-4" style={{
          position: 'absolute', bottom: '-5%', right: '4%',
          width: 480, height: 480, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,87,108,0.22) 0%, transparent 68%)',
          filter: 'blur(52px)',
        }} />
        <div style={{
          position: 'absolute', top: '38%', left: '45%',
          width: 900, height: 900, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(118,75,162,0.14) 0%, transparent 65%)',
          filter: 'blur(70px)', transform: 'translate(-50%,-50%)',
        }} />

        {/* Dot grid */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.55 }}
             viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
          {DOTS.map(({ row, col }) => (
            <circle key={`${row}-${col}`}
              cx={col * 88 + 44} cy={row * 82 + 41}
              r={(row + col) % 3 === 0 ? 1.6 : 1}
              fill={`rgba(255,255,255,${(row + col) % 5 === 0 ? 0.07 : 0.03})`}
            />
          ))}
        </svg>

        {/* Abstract flowing curves + geometry */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
             viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">

          {/* Long sweeping arcs */}
          <path d="M -80 380 Q 320 80 740 280 T 1540 180"
                fill="none" stroke="rgba(102,126,234,0.18)" strokeWidth="1.5" />
          <path d="M -80 420 Q 420 120 860 340 T 1580 240"
                fill="none" stroke="rgba(102,126,234,0.1)" strokeWidth="1" strokeDasharray="6 12" />
          <path d="M 180 -40 Q 420 280 310 580 T 520 920"
                fill="none" stroke="rgba(240,147,251,0.14)" strokeWidth="1.5" />
          <path d="M 1260 -40 Q 1120 200 1320 500 T 1080 940"
                fill="none" stroke="rgba(240,147,251,0.1)" strokeWidth="1" strokeDasharray="4 10" />
          <path d="M -40 680 Q 440 480 860 640 T 1520 520"
                fill="none" stroke="rgba(79,172,254,0.12)" strokeWidth="1.5" />
          <path d="M 0 160 Q 680 -20 980 320 Q 1280 640 1440 420"
                fill="none" stroke="rgba(118,75,162,0.15)" strokeWidth="2" />

          {/* Diagonal ruled lines */}
          <line x1="0" y1="0" x2="380" y2="900" stroke="rgba(102,126,234,0.06)" strokeWidth="1" />
          <line x1="220" y1="0" x2="600" y2="900" stroke="rgba(102,126,234,0.04)" strokeWidth="1" />
          <line x1="1060" y1="0" x2="1440" y2="900" stroke="rgba(240,147,251,0.05)" strokeWidth="1" />
          <line x1="860" y1="0" x2="1240" y2="900" stroke="rgba(240,147,251,0.04)" strokeWidth="1" />

          {/* Concentric rings — top-left */}
          <circle cx="140" cy="140" r="70"  fill="none" stroke="rgba(102,126,234,0.12)" strokeWidth="1" />
          <circle cx="140" cy="140" r="110" fill="none" stroke="rgba(102,126,234,0.07)" strokeWidth="1" />
          <circle cx="140" cy="140" r="150" fill="none" stroke="rgba(102,126,234,0.04)" strokeWidth="1" />

          {/* Concentric rings — bottom-right */}
          <circle cx="1310" cy="740" r="90"  fill="none" stroke="rgba(240,147,251,0.1)"  strokeWidth="1" />
          <circle cx="1310" cy="740" r="140" fill="none" stroke="rgba(240,147,251,0.06)" strokeWidth="1" />
          <circle cx="1310" cy="740" r="190" fill="none" stroke="rgba(240,147,251,0.04)" strokeWidth="1" />

          {/* Large mid ring */}
          <circle cx="720" cy="450" r="280"
                  fill="none" stroke="rgba(118,75,162,0.06)" strokeWidth="1.5" strokeDasharray="8 16" />

          {/* Crosshair accents */}
          <line x1="136" y1="110" x2="136" y2="170" stroke="rgba(102,126,234,0.25)" strokeWidth="1.5" />
          <line x1="110" y1="140" x2="166" y2="140" stroke="rgba(102,126,234,0.25)" strokeWidth="1.5" />
          <line x1="1306" y1="710" x2="1306" y2="770" stroke="rgba(240,147,251,0.2)" strokeWidth="1.5" />
          <line x1="1280" y1="740" x2="1336" y2="740" stroke="rgba(240,147,251,0.2)" strokeWidth="1.5" />

          {/* Waveform strip — bottom */}
          {Array.from({ length: 48 }).map((_, i) => {
            const x = (i / 47) * 1440;
            const h = 6 + Math.sin(i * 0.42) * 10 + Math.sin(i * 0.91) * 6;
            return (
              <rect key={i} x={x - 2} y={880 - h} width="3" height={h}
                    fill={`rgba(102,126,234,${0.08 + Math.abs(Math.sin(i * 0.42)) * 0.1})`}
                    rx="1.5" />
            );
          })}

          {/* Floating music glyphs */}
          <text x="72"  y="695" fontSize="26" fill="rgba(102,126,234,0.18)" fontFamily="serif">♩</text>
          <text x="1320" y="175" fontSize="34" fill="rgba(240,147,251,0.14)" fontFamily="serif">♫</text>
          <text x="1115" y="615" fontSize="22" fill="rgba(102,126,234,0.12)" fontFamily="serif">♪</text>
          <text x="305"  y="195" fontSize="20" fill="rgba(118,75,162,0.18)" fontFamily="serif">♬</text>
          <text x="1380" y="480" fontSize="18" fill="rgba(79,172,254,0.12)" fontFamily="serif">♩</text>
          <text x="42"   y="360" fontSize="16" fill="rgba(245,87,108,0.12)" fontFamily="serif">♪</text>
        </svg>
      </div>

      {/* ── Main content ─────────────────────────────────────────── */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', padding: '64px 24px 48px',
        maxWidth: 820, width: '100%',
      }}>

        {/* Top badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 36,
          background: 'rgba(102,126,234,0.12)', border: '1px solid rgba(102,126,234,0.28)',
          borderRadius: 100, padding: '7px 18px',
          fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: '#a5b4fc',
        }}>
          <span>🎩</span> Music Snobbery as a Service
        </div>

        {/* Wordmark */}
        <h1 style={{
          margin: '0 0 4px',
          fontSize: 'clamp(4rem, 12vw, 8rem)',
          fontWeight: 900, lineHeight: 0.92, letterSpacing: '-4px',
          background: 'linear-gradient(135deg, #ffffff 0%, #c4b5fd 40%, #f093fb 80%, #f5576c 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          Snobify
        </h1>

        {/* Subtitle */}
        <p style={{
          margin: '16px 0 44px',
          fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
          color: 'rgba(255,255,255,0.42)', fontWeight: 300, letterSpacing: '0.08em',
        }}>
          Your Music Taste, Professionally Judged
        </p>

        {/* Rotating quote */}
        <div style={{
          width: '100%', maxWidth: 580,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 18, padding: '26px 32px', marginBottom: 40,
          backdropFilter: 'blur(12px)',
          opacity: quoteVisible ? 1 : 0,
          transform: quoteVisible ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 0.45s ease, transform 0.45s ease',
        }}>
          <div style={{ fontSize: 36, lineHeight: 1, color: 'rgba(102,126,234,0.5)', marginBottom: 2, fontFamily: 'Georgia, serif' }}>"</div>
          <p style={{
            margin: '0 0 14px',
            fontSize: 'clamp(0.92rem, 2vw, 1.08rem)',
            lineHeight: 1.65, fontStyle: 'italic', fontWeight: 300,
            color: 'rgba(255,255,255,0.82)',
          }}>
            {QUOTES[quoteIdx]}
          </p>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              The Snob
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 48 }}>
          {FEATURES.map((f, i) => (
            <div key={f.label} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: i % 2 === 0
                ? 'rgba(102,126,234,0.1)'
                : 'rgba(240,147,251,0.08)',
              border: `1px solid ${i % 2 === 0 ? 'rgba(102,126,234,0.2)' : 'rgba(240,147,251,0.15)'}`,
              borderRadius: 100, padding: '9px 18px',
            }}>
              <span style={{ fontSize: 16 }}>{f.icon}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.88)', lineHeight: 1.3 }}>{f.label}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', lineHeight: 1.2 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onGetStarted}
          className="snob-cta-btn"
          style={{
            padding: '19px 56px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white', border: 'none', borderRadius: 16,
            fontSize: 17, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.03em',
            boxShadow: '0 8px 32px rgba(102,126,234,0.45), 0 0 0 1px rgba(102,126,234,0.25)',
            transition: 'all 0.25s ease',
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 16px 44px rgba(102,126,234,0.6), 0 0 0 1px rgba(102,126,234,0.35)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(102,126,234,0.45), 0 0 0 1px rgba(102,126,234,0.25)';
          }}
        >
          Begin the Assessment →
        </button>

        <p style={{ marginTop: 14, fontSize: 11, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.05em' }}>
          Upload your Spotify export · No account required · No judgment withheld
        </p>
      </div>

      {/* ── Scrolling genre ticker ───────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '11px 0', overflow: 'hidden',
        background: 'rgba(0,0,0,0.2)',
      }}>
        <div style={{
          display: 'flex', gap: 52, whiteSpace: 'nowrap',
          animation: 'snobTicker 28s linear infinite',
          fontSize: 10, color: 'rgba(255,255,255,0.18)',
          letterSpacing: '0.18em', fontWeight: 600, textTransform: 'uppercase',
        }}>
          {[...TICKER_GENRES, ...TICKER_GENRES].map((g, i) => (
            <span key={i} style={{ color: i % 4 === 0 ? 'rgba(102,126,234,0.4)' : i % 4 === 2 ? 'rgba(240,147,251,0.3)' : 'rgba(255,255,255,0.18)' }}>
              ◆ {g}
            </span>
          ))}
        </div>
      </div>

      {/* ── Keyframes ────────────────────────────────────────────── */}
      <style>{`
        @keyframes snobTicker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes snobFloat1 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33%       { transform: translateY(-22px) translateX(10px); }
          66%       { transform: translateY(12px) translateX(-8px); }
        }
        @keyframes snobFloat2 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33%       { transform: translateY(18px) translateX(-12px); }
          66%       { transform: translateY(-14px) translateX(6px); }
        }
        @keyframes snobFloat3 {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-16px); }
        }
        .snob-orb-1 { animation: snobFloat1 14s ease-in-out infinite; }
        .snob-orb-2 { animation: snobFloat2 18s ease-in-out infinite; }
        .snob-orb-3 { animation: snobFloat3 12s ease-in-out infinite; }
        .snob-orb-4 { animation: snobFloat2 16s ease-in-out infinite reverse; }
      `}</style>
    </div>
  );
}
