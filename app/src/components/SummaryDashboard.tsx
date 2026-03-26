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
    rows: stats?.meta?.rows || 0
  });

  try {
    const totalTracks = stats._counters?.uniqueTracks ?? 0;
    const totalPlays = stats._counters?.uniquePlays ?? stats.meta.rows;
    const genreCount = stats.topUniqueGenres?.length ?? 0;
    const rareCount = stats.rareTracks?.length ?? 0;
    const avgPopularity = rareCount > 0
      ? Math.round(stats.rareTracks.reduce((s, t) => s + t.pop, 0) / rareCount)
      : 0;

    // Activity-based stats from activityTrend
    const now = new Date();
    const thisYearPrefix = String(now.getFullYear());
    const thisMonthKey = `${thisYearPrefix}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const thisYearPlays = stats.activityTrend
      ?.filter(t => t.month.startsWith(thisYearPrefix))
      .reduce((s, t) => s + t.count, 0) ?? 0;

    const thisMonthPlays = stats.activityTrend
      ?.find(t => t.month === thisMonthKey)?.count ?? 0;

    const discoveredThisYear = stats.discoveryTrend
      ?.filter(t => t.month.startsWith(thisYearPrefix))
      .reduce((s, t) => s + t.count, 0) ?? 0;

    const { taste, playlistRater } = stats;

    logger.info('SUMMARY_DASHBOARD', 'Stats calculated', {
      totalTracks, totalPlays, genreCount, thisYearPlays, thisMonthPlays
    });

    const generateSnobRemark = () => {
      if (playlistRater.rarityScore > 70) {
        return "Your library oozes underground cred — algorithms tried, failed, and cried. Gorgeous chaos.";
      } else if (playlistRater.rarityScore < 30) {
        return "Your taste is so mainstream, I can practically hear the Top 40 playing in the background. How delightfully predictable.";
      } else if (genreCount > 10) {
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
            <div className="stat-label">Unique Tracks</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{totalPlays.toLocaleString()}</div>
            <div className="stat-label">Total Plays</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{thisYearPlays.toLocaleString()}</div>
            <div className="stat-label">This Year</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{thisMonthPlays.toLocaleString()}</div>
            <div className="stat-label">This Month</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{genreCount}</div>
            <div className="stat-label">Top Genres</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{discoveredThisYear.toLocaleString()}</div>
            <div className="stat-label">Discovered This Year</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{playlistRater.rarityScore}</div>
            <div className="stat-label">Rarity Score</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{playlistRater.overall}</div>
            <div className="stat-label">Overall Score</div>
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
      errorStack: error instanceof Error ? error.stack : undefined
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
