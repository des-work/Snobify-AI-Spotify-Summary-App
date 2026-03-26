import React from 'react';
import type { Stats } from '../types';

interface TasteProfileProps {
  stats: Stats;
  onBack: () => void;
  onExport: () => void;
}

export default function TasteProfile({ stats, onBack, onExport }: TasteProfileProps) {
  const { taste, playlistRater, topUniqueGenres } = stats;

  const pct = (n: number) => Math.round(n * 100);

  // Top genres from computed stats
  const topGenres = topUniqueGenres.slice(0, 10);

  // Generate taste profile assessment from the pre-computed taste object
  const generateTasteAssessment = () => {
    const assessments: string[] = [];

    if (taste.avgDanceability > 0.7) {
      assessments.push("You clearly enjoy music that makes you move. Either you're a natural dancer or you just really like pretending to be one.");
    } else if (taste.avgDanceability < 0.3) {
      assessments.push("Your music is so undanceable, even your shadow refuses to move to it. Admirably anti-rhythmic.");
    }

    if (taste.avgEnergy > 0.8) {
      assessments.push("Your playlist could power a small city. I'm surprised your speakers haven't exploded yet.");
    } else if (taste.avgEnergy < 0.3) {
      assessments.push("Your music is so mellow, it makes meditation seem like a high-energy activity.");
    }

    if (taste.avgValence > 0.7) {
      assessments.push("Your taste is so upbeat, it's practically radiating sunshine. How... cheerful.");
    } else if (taste.avgValence < 0.3) {
      assessments.push("Your music is so melancholic, it makes rainy days seem optimistic. Impressively moody.");
    }

    if (taste.acousticBias > 0.7) {
      assessments.push("You clearly appreciate the organic sound of real instruments. How delightfully analog of you.");
    }

    if (taste.instrumentalBias > 0.5) {
      assessments.push("You enjoy music without words. Either you're a purist or you just really hate lyrics.");
    }

    return assessments.length > 0 ? assessments.join(" ") : "Your musical taste is... interesting. A balanced blend that defies easy classification.";
  };

  // Overall composite score
  const overallPct = Math.round(
    (taste.avgDanceability + taste.avgEnergy + taste.avgValence + taste.acousticBias + taste.instrumentalBias) / 5 * 100
  );

  return (
    <div className="container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Your Complete Taste Profile</h1>
          <p className="dashboard-subtitle">The Snob's final verdict on your musical identity</p>
        </div>
        <div className="snob-avatar" style={{ width: '80px', height: '80px', margin: 0 }}>
          <div style={{ fontSize: '2rem' }}>🎭</div>
        </div>
      </div>

      <div className="grid-3">
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Danceability</h3>
          <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '8px' }}>
            {pct(taste.avgDanceability)}%
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct(taste.avgDanceability)}%` }} />
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Energy</h3>
          <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '8px' }}>
            {pct(taste.avgEnergy)}%
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct(taste.avgEnergy)}%` }} />
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Positivity</h3>
          <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '8px' }}>
            {pct(taste.avgValence)}%
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct(taste.avgValence)}%` }} />
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Acousticness</h3>
          <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '8px' }}>
            {pct(taste.acousticBias)}%
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct(taste.acousticBias)}%` }} />
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Instrumentalness</h3>
          <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '8px' }}>
            {pct(taste.instrumentalBias)}%
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct(taste.instrumentalBias)}%` }} />
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Overall Score</h3>
          <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '8px' }}>
            {overallPct}%
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${overallPct}%` }} />
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2 className="title">Your Top Genres</h2>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {topGenres.map((g, index) => (
              <div key={index} style={{
                padding: '12px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: '600' }}>{g.genre}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{g.count} tracks</div>
                </div>
                <div style={{
                  background: 'var(--gradient-primary)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}>
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="title">Playlist Ratings</h2>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {([
              ['Rarity', playlistRater.rarityScore],
              ['Cohesion', playlistRater.cohesion],
              ['Variety', playlistRater.variety],
              ['Creativity', playlistRater.creativity ?? 0],
              ['Overall', playlistRater.overall],
            ] as [string, number][]).map(([label, value], index) => (
              <div key={index} style={{
                padding: '12px',
                borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '600' }}>{label}</span>
                  <span style={{
                    background: 'var(--gradient-secondary)',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: '600'
                  }}>
                    {value}/100
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="title">The Snob's Final Assessment</h2>
        <div className="snob-remark">
          {generateTasteAssessment()}
        </div>
        <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
          <p style={{ margin: 0, fontStyle: 'italic' }}>
            "Your musical DNA has been thoroughly analyzed, and the results are...
            {playlistRater.overall > 60 ? ' surprisingly sophisticated' : ' exactly what I expected'}.
            Whether you choose to embrace or reject this assessment is entirely up to you,
            but remember: I'm always right about music."
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
        <button className="btn btn-secondary" onClick={onBack}>
          ← Back to Rarity
        </button>
        <button className="btn" onClick={onExport} style={{ background: 'var(--gradient-secondary)' }}>
          Export My Snob Report
        </button>
      </div>
    </div>
  );
}
