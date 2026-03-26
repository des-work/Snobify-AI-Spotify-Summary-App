import React from 'react';
import type { Stats } from '../types';

interface RarityAnalysisProps {
  stats: Stats;
  onNext: () => void;
  onBack: () => void;
}

export default function RarityAnalysis({ stats, onNext, onBack }: RarityAnalysisProps) {
  const rareTracks = stats.rareTracks ?? [];
  const { playlistRater } = stats;
  const rarityScore = playlistRater?.rarityScore ?? 0;

  const getRarityTier = () => {
    if (rarityScore >= 80) return { label: 'Legendary', class: 'rarity-legendary' };
    if (rarityScore >= 60) return { label: 'Underground', class: 'rarity-underground' };
    if (rarityScore >= 40) return { label: 'Niche', class: 'rarity-niche' };
    return { label: 'Mainstream', class: 'rarity-mainstream' };
  };

  const tier = getRarityTier();

  // Group rare tracks by artist to find underground artists
  const artistPops: Record<string, number[]> = {};
  for (const t of rareTracks) {
    (artistPops[t.artist] ??= []).push(t.pop);
  }
  const rareArtists = Object.entries(artistPops)
    .map(([artist, pops]) => ({ artist, avgPop: Math.round(pops.reduce((a, b) => a + b, 0) / pops.length) }))
    .sort((a, b) => a.avgPop - b.avgPop)
    .slice(0, 8);

  const generateRarityRemark = () => {
    if (rarityScore >= 80) {
      return "Impressive. You've managed to avoid the mainstream like it's a plague. Your taste is so underground, I'm surprised you haven't discovered music that doesn't exist yet.";
    } else if (rarityScore >= 60) {
      return "A respectable level of obscurity. You're not quite mainstream, but you're not exactly pioneering new musical frontiers either. Comfortably niche.";
    } else if (rarityScore >= 40) {
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
              {rarityScore}%
            </div>
            <div className={`rarity-score ${tier.class}`}>
              {tier.label}
            </div>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${rarityScore}%` }}
            />
          </div>
          <p style={{ marginTop: '16px', color: 'var(--muted)' }}>
            Based on inverse average Spotify popularity. Higher = more obscure.
          </p>
        </div>

        <div className="card">
          <h2 className="title">Rarity Breakdown</h2>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Rarity Score</span>
              <span>{rarityScore}/100</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${rarityScore}%` }}
              />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Cohesion</span>
              <span>{playlistRater.cohesion}/100</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${playlistRater.cohesion}%` }}
              />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Variety</span>
              <span>{playlistRater.variety}/100</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${playlistRater.variety}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2 className="title">Your Rarest Finds</h2>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {rareTracks.slice(0, 10).map((track, index) => (
              <div key={index} style={{
                padding: '12px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: '600' }}>{track.name}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{track.artist}</div>
                </div>
                <div className={`rarity-score ${track.pop < 20 ? 'rarity-legendary' : 'rarity-underground'}`}>
                  {track.pop}/100
                </div>
              </div>
            ))}
            {rareTracks.length === 0 && (
              <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '24px' }}>
                No rare tracks found in your library.
              </p>
            )}
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
                <div className={`rarity-score ${artist.avgPop < 25 ? 'rarity-legendary' : 'rarity-niche'}`}>
                  {artist.avgPop}/100
                </div>
              </div>
            ))}
            {rareArtists.length === 0 && (
              <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '24px' }}>
                No underground artists found.
              </p>
            )}
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
