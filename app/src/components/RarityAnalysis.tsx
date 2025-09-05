import React from 'react';
import type { Stats } from '../types';

interface RarityAnalysisProps {
  stats: Stats;
  onNext: () => void;
  onBack: () => void;
}

export default function RarityAnalysis({ stats, onNext, onBack }: RarityAnalysisProps) {
  // Calculate rarity metrics
  const tracks = stats.tracks || [];
  const avgPopularity = tracks.reduce((sum, track) => sum + (track.popularity || 0), 0) / tracks.length;
  
  // Find rare tracks (popularity < 30)
  const rareTracks = tracks
    .filter(track => (track.popularity || 0) < 30)
    .sort((a, b) => (a.popularity || 0) - (b.popularity || 0))
    .slice(0, 10);

  // Find rare artists
  const artistPopularity = tracks.reduce((acc, track) => {
    if (track.artistName) {
      acc[track.artistName] = (acc[track.artistName] || 0) + (track.popularity || 0);
    }
    return acc;
  }, {} as Record<string, number>);

  const rareArtists = Object.entries(artistPopularity)
    .map(([artist, totalPop]) => ({ artist, avgPopularity: totalPop / tracks.filter(t => t.artistName === artist).length }))
    .filter(a => a.avgPopularity < 40)
    .sort((a, b) => a.avgPopularity - b.avgPopularity)
    .slice(0, 8);

  // Calculate overall rarity score
  const getRarityScore = () => {
    if (avgPopularity < 20) return { score: 95, label: 'Legendary', class: 'rarity-legendary' };
    if (avgPopularity < 35) return { score: 80, label: 'Underground', class: 'rarity-underground' };
    if (avgPopularity < 50) return { score: 60, label: 'Niche', class: 'rarity-niche' };
    return { score: 25, label: 'Mainstream', class: 'rarity-mainstream' };
  };

  const rarityScore = getRarityScore();

  // Generate rarity-based snob remarks
  const generateRarityRemark = () => {
    if (rarityScore.score > 80) {
      return "Impressive. You've managed to avoid the mainstream like it's a plague. Your taste is so underground, I'm surprised you haven't discovered music that doesn't exist yet.";
    } else if (rarityScore.score > 60) {
      return "A respectable level of obscurity. You're not quite mainstream, but you're not exactly pioneering new musical frontiers either. Comfortably niche.";
    } else if (rarityScore.score > 30) {
      return "Your taste is... adequate. You've found a nice middle ground between popular and obscure. How delightfully average.";
    } else {
      return "Oh dear. Your musical preferences are so mainstream, I can practically hear the radio DJ introducing your playlist. How... predictable.";
    }
  };

  return (
    <div className="container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Rarity Analysis</h1>
          <p className="dashboard-subtitle">How underground is your taste, really?</p>
        </div>
        <div className="snob-avatar" style={{ width: '80px', height: '80px', margin: 0 }}>
          <div style={{ fontSize: '2rem' }}>🔍</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2 className="title">Your Rarity Score</h2>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '4rem', fontWeight: '900', marginBottom: '16px' }}>
              {rarityScore.score}%
            </div>
            <div className={`rarity-score ${rarityScore.class}`}>
              {rarityScore.label}
            </div>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${rarityScore.score}%` }}
            />
          </div>
          <p style={{ marginTop: '16px', color: 'var(--muted)' }}>
            Based on Spotify popularity scores. Lower scores = more mainstream.
          </p>
        </div>

        <div className="card">
          <h2 className="title">Rarity Breakdown</h2>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Average Popularity</span>
              <span>{Math.round(avgPopularity)}/100</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${avgPopularity}%` }}
              />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Rare Tracks Found</span>
              <span>{rareTracks.length}</span>
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Underground Artists</span>
              <span>{rareArtists.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2 className="title">Your Rarest Finds</h2>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {rareTracks.map((track, index) => (
              <div key={index} style={{ 
                padding: '12px', 
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: '600' }}>{track.trackName}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{track.artistName}</div>
                </div>
                <div className={`rarity-score ${track.popularity! < 20 ? 'rarity-legendary' : 'rarity-underground'}`}>
                  {track.popularity}/100
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="title">Underground Artists</h2>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {rareArtists.map((artist, index) => (
              <div key={index} style={{ 
                padding: '12px', 
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ fontWeight: '600' }}>{artist.artist}</div>
                <div className={`rarity-score ${artist.avgPopularity < 25 ? 'rarity-legendary' : 'rarity-niche'}`}>
                  {Math.round(artist.avgPopularity)}/100
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="title">The Snob's Rarity Verdict</h2>
        <div className="snob-remark">
          {generateRarityRemark()}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
        <button className="btn btn-secondary" onClick={onBack}>
          ← Back to Summary
        </button>
        <button className="btn" onClick={onNext}>
          Continue to Taste Profile →
        </button>
      </div>
    </div>
  );
}
