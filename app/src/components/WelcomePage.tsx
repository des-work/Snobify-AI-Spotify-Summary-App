import React from 'react';

interface WelcomePageProps {
  onGetStarted: () => void;
}

export default function WelcomePage({ onGetStarted }: WelcomePageProps) {
  return (
    <div className="welcome-container">
      <div className="fade-in-up">
        <h1 className="welcome-title">Snobify</h1>
        <p className="welcome-subtitle">Your Music Taste, Judged</p>
        
        <div className="snob-avatar pulse">
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem'
          }}>
            🎵
          </div>
        </div>
        
        <div className="welcome-description">
          <p>
            Welcome to <strong>Snobify</strong> - where your music taste gets the pretentious 
            analysis it deserves. Our resident music snob will dissect your listening habits, 
            judge your genre choices, and deliver brutally honest (but hilariously accurate) 
            commentary on your musical preferences.
          </p>
          <p>
            Prepare to discover just how mainstream, niche, or downright legendary your taste really is. 
            No mercy, no sugar-coating - just pure, unadulterated music snobbery.
          </p>
        </div>
        
        <button className="btn" onClick={onGetStarted} style={{
          fontSize: '1.2rem',
          padding: '16px 32px',
          background: 'rgba(255,255,255,0.2)',
          border: '2px solid rgba(255,255,255,0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          Get Started ��
        </button>
      </div>
    </div>
  );
}
