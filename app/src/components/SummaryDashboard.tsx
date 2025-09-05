import React from 'react';
import type { Stats } from '../types';
import { logger } from '../utils/debugLogger';

interface SummaryDashboardProps {
  stats: Stats;
  onNext: () => void;
}

export default function SummaryDashboard({ stats, onNext }: SummaryDashboardProps) {
  logger.debug('SUMMARY_DASHBOARD', 'Component rendered', { 
    hasStats: !!stats,
    trackCount: stats?.tracks?.length || 0 
  });

  try {
    // Calculate time-based stats
    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth();
    const thisWeek = Math.floor(now.getDate() / 7);
    
    logger.debug('SUMMARY_DASHBOARD', 'Calculating time-based stats', {
      thisYear,
      thisMonth,
      thisWeek,
      totalTracks: stats.tracks?.length || 0
    });

    const currentYearData = stats.tracks?.filter(track => {
      try {
        const playDate = new Date(track.playedAt || track.addedAt || '');
        return playDate.getFullYear() === thisYear;
      } catch (e) {
        logger.warn('SUMMARY_DASHBOARD', 'Invalid date in track', { 
          track: track.trackName,
          playedAt: track.playedAt,
          addedAt: track.addedAt 
        });
        return false;
      }
    }) || [];
    
    const currentMonthData = currentYearData.filter(track => {
      try {
        const playDate = new Date(track.playedAt || track.addedAt || '');
        return playDate.getMonth() === thisMonth;
      } catch (e) {
        logger.warn('SUMMARY_DASHBOARD', 'Invalid date in track for month filter', { 
          track: track.trackName 
        });
        return false;
      }
    });
    
    const currentWeekData = currentMonthData.filter(track => {
      try {
        const playDate = new Date(track.playedAt || track.addedAt || '');
        return Math.floor(playDate.getDate() / 7) === thisWeek;
      } catch (e) {
        logger.warn('SUMMARY_DASHBOARD', 'Invalid date in track for week filter', { 
          track: track.trackName 
        });
        return false;
      }
    });

    logger.info('SUMMARY_DASHBOARD', 'Time-based stats calculated', {
      currentYearData: currentYearData.length,
      currentMonthData: currentMonthData.length,
      currentWeekData: currentWeekData.length
    });

    // Calculate unique genres and artists
    const uniqueGenres = new Set(stats.tracks?.map(t => t.genres).flat().filter(Boolean)).size;
    const uniqueArtists = new Set(stats.tracks?.map(t => t.artistName).filter(Boolean)).size;
    
    logger.debug('SUMMARY_DASHBOARD', 'Unique counts calculated', {
      uniqueGenres,
      uniqueArtists
    });

    // Calculate niche genres (less popular)
    const genrePopularity = stats.tracks?.reduce((acc, track) => {
      if (track.genres) {
        track.genres.forEach(genre => {
          acc[genre] = (acc[genre] || 0) + (track.popularity || 0);
        });
      }
      return acc;
    }, {} as Record<string, number>) || {};
    
    const nicheGenres = Object.entries(genrePopularity)
      .filter(([_, popularity]) => popularity < 50) // Less popular threshold
      .length;

    const totalTracks = stats.tracks?.length || 0;
    const avgPopularity = stats.tracks?.reduce((sum, track) => sum + (track.popularity || 0), 0) / totalTracks || 0;

    logger.info('SUMMARY_DASHBOARD', 'All calculations completed', {
      totalTracks,
      avgPopularity,
      nicheGenres
    });

    // Generate snob remarks
    const generateSnobRemark = () => {
      if (avgPopularity > 70) {
        return "Your taste is so mainstream, I can practically hear the Top 40 playing in the background. How delightfully predictable.";
      } else if (avgPopularity < 30) {
        return "Well, well, well... someone's been digging in the underground. I'm almost impressed by your commitment to obscurity.";
      } else if (uniqueGenres > 20) {
        return "A musical chameleon, I see. Your genre-hopping is either admirably eclectic or desperately indecisive. I'll let you decide.";
      } else {
        return "Your musical preferences are... adequate. Not groundbreaking, not terrible, just comfortably mediocre.";
      }
    };

    return (
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Your Musical Profile</h1>
            <p className="dashboard-subtitle">Let's see what The Snob has to say about your taste...</p>
          </div>
          <div className="snob-avatar" style={{ width: '80px', height: '80px', margin: 0 }}>
            <div style={{ fontSize: '2rem' }}>🎧</div>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{totalTracks.toLocaleString()}</div>
            <div className="stat-label">Total Tracks</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{currentYearData.length.toLocaleString()}</div>
            <div className="stat-label">This Year</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{currentMonthData.length.toLocaleString()}</div>
            <div className="stat-label">This Month</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{currentWeekData.length.toLocaleString()}</div>
            <div className="stat-label">This Week</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{uniqueGenres}</div>
            <div className="stat-label">Unique Genres</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{uniqueArtists}</div>
            <div className="stat-label">Unique Artists</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{nicheGenres}</div>
            <div className="stat-label">Niche Genres</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{Math.round(avgPopularity)}</div>
            <div className="stat-label">Avg Popularity</div>
          </div>
        </div>

        <div className="card">
          <h2 className="title">The Snob's Initial Assessment</h2>
          <div className="snob-remark">
            {generateSnobRemark()}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <button className="btn" onClick={onNext}>
            Continue to Rarity Analysis →
          </button>
        </div>
      </div>
    );
  } catch (error) {
    logger.error('SUMMARY_DASHBOARD', 'Component error', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      stats: {
        hasStats: !!stats,
        trackCount: stats?.tracks?.length || 0
      }
    });

    return (
      <div className="container">
        <div className="card">
          <h2 className="title">Error in Summary Dashboard</h2>
          <p>Something went wrong while processing your data. Please try refreshing the page.</p>
          <button className="btn" onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
}
