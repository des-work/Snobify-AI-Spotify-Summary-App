import React from 'react';
import type { Stats } from '../types';

interface TasteProfileProps {
  stats: Stats;
  onBack: () => void;
  onExport: () => void;
}

export default function TasteProfile({ stats, onBack, onExport }: TasteProfileProps) {
  const tracks = stats.tracks || [];
  
  // Calculate taste metrics
  const avgDanceability = tracks.reduce((sum, track) => sum + (track.danceability || 0), 0) / tracks.length;
  const avgEnergy = tracks.reduce((sum, track) => sum + (track.energy || 0), 0) / tracks.length;
  const avgValence = tracks.reduce((sum, track) => sum + (track.valence || 0), 0) / tracks.length;
  const avgAcousticness = tracks.reduce((sum, track) => sum + (track.acousticness || 0), 0) / tracks.length;
  const avgInstrumentalness = tracks.reduce((sum, track) => sum + (track.instrumentalness || 0), 0) / tracks.length;

  // Genre analysis
  const genreCounts = tracks.reduce((acc, track) => {
    if (track.genres) {
      track.genres.forEach(genre => {
        acc[genre] = (acc[genre] || 0) + 1;
      });
    }
    return acc;
  }, {} as Record<string, number>);

  const topGenres = Object.entries(genreCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  // Artist analysis
  const artistCounts = tracks.reduce((acc, track) => {
    if (track.artistName) {
      acc[track.artistName] = (acc[track.artistName] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topArtists = Object.entries(artistCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8);

  // Generate taste profile assessment
  const generateTasteAssessment = () => {
    const assessments = [];
    
    if (avgDanceability > 0.7) {
      assessments.push("You clearly enjoy music that makes you move. Either you're a natural dancer or you just really like pretending to be one.");
    } else if (avgDanceability < 0.3) {
      assessments.push("Your music is so undanceable, even your shadow refuses to move to it. Admirably anti-rhythmic.");
    }
    
    if (avgEnergy > 0.8) {
      assessments.push("Your playlist could power a small city. I'm surprised your speakers haven't exploded yet.");
    } else if (avgEnergy < 0.3) {
      assessments.push("Your music is so mellow, it makes meditation seem like a high-energy activity.");
    }
    
    if (avgValence > 0.7) {
      assessments.push("Your taste is so upbeat, it's practically radiating sunshine. How... cheerful.");
    } else if (avgValence < 0.3) {
      assessments.push("Your music is so melancholic, it makes rainy days seem optimistic. Impressively moody.");
    }
    
    if (avgAcousticness > 0.7) {
      assessments.push("You clearly appreciate the organic sound of real instruments. How delightfully analog of you.");
    }
    
    if (avgInstrumentalness > 0.5) {
      assessments.push("You enjoy music without words. Either you're a purist or you just really hate lyrics.");
    }
    
    return assessments.length > 0 ? assessments.join(" ") : "Your musical taste is... interesting. I'll leave it at that.";
  };

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
            {Math.round(avgDanceability * 100)}%
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${avgDanceability * 100}%` }}
            />
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Energy</h3>
          <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '8px' }}>
            {Math.round(avgEnergy * 100)}%
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${avgEnergy * 100}%` }}
            />
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Positivity</h3>
          <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '8px' }}>
            {Math.round(avgValence * 100)}%
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${avgValence * 100}%` }}
            />
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Acousticness</h3>
          <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '8px' }}>
            {Math.round(avgAcousticness * 100)}%
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${avgAcousticness * 100}%` }}
            />
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Instrumentalness</h3>
          <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '8px' }}>
            {Math.round(avgInstrumentalness * 100)}%
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${avgInstrumentalness * 100}%` }}
            />
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Overall Score</h3>
          <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '8px' }}>
            {Math.round((avgDanceability + avgEnergy + avgValence + avgAcousticness + avgInstrumentalness) / 5 * 100)}%
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(avgDanceability + avgEnergy + avgValence + avgAcousticness + avgInstrumentalness) / 5 * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2 className="title">Your Top Genres</h2>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {topGenres.map(([genre, count], index) => (
              <div key={index} style={{ 
                padding: '12px', 
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: '600' }}>{genre}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{count} tracks</div>
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
          <h2 className="title">Your Top Artists</h2>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {topArtists.map(([artist, count], index) => (
              <div key={index} style={{ 
                padding: '12px', 
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: '600' }}>{artist}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{count} tracks</div>
                </div>
                <div style={{ 
                  background: 'var(--gradient-secondary)',
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
      </div>

      <div className="card">
        <h2 className="title">The Snob's Final Assessment</h2>
        <div className="snob-remark">
          {generateTasteAssessment()}
        </div>
        <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
          <p style={{ margin: 0, fontStyle: 'italic' }}>
            "Your musical DNA has been thoroughly analyzed, and the results are... 
            {Math.random() > 0.5 ? 'surprisingly sophisticated' : 'exactly what I expected'}. 
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
          Export My Snob Report ��
        </button>
      </div>
    </div>
  );
}
