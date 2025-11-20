import "./styles.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchStats, fetchDebug } from "./api/client";
import type { Stats } from "./types";
import dataFlowManager from "./data/dataFlowManager";
import ErrorBoundary from "./components/ErrorBoundary";
import DebugPanel from "./components/DebugPanel";
import ConnectionStatusComponent from "./components/ConnectionStatus";
import SceneContainer from "./components/3d/SceneContainer";
import { LoadingSpinner, ErrorState, EmptyState, LoadingStyles } from "./components/LoadingStates";
import { useStatsData } from "./hooks/useDataLoader";
import WelcomePage from "./components/WelcomePage";
import SummaryDashboard from "./components/SummaryDashboard";
import RarityAnalysis from "./components/RarityAnalysis";
import TasteProfile from "./components/TasteProfile";
import { exportPdf } from "./pdf";
import { exportCardPng } from "./export";
import { logger } from "./utils/debugLogger";

type AppPage = 'welcome' | 'summary' | 'rarity' | 'taste';

export default function App() {
  const [profile, setProfile] = useState("default");
  const [currentPage, setCurrentPage] = useState<AppPage>('welcome');
  const [debugPanelOpen, setDebugPanelOpen] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use the enhanced data loader hook
  const {
    data: stats,
    loading,
    error,
    retry,
    refresh,
    debugInfo,
  } = useStatsData(profile);

  useEffect(() => {
    logger.info('APP', 'Snobify app initialized', {
      profile,
      currentPage,
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  }, []);

  useEffect(() => {
    logger.info('APP', 'Snobify app initialized', {
      profile,
      currentPage,
      userAgent: navigator.userAgent,
      url: window.location.href,
      debugInfo,
    });
  }, [profile, currentPage, debugInfo]);

  const handleGetStarted = () => {
    logger.info('APP', 'User started the app flow');
    setCurrentPage('summary');
  };

  const handleNext = () => {
    logger.debug('APP', `Navigating from ${currentPage} to next page`);
    if (currentPage === 'summary') setCurrentPage('rarity');
    if (currentPage === 'rarity') setCurrentPage('taste');
  };

  const handleBack = () => {
    logger.debug('APP', `Navigating back from ${currentPage}`);
    if (currentPage === 'rarity') setCurrentPage('summary');
    if (currentPage === 'taste') setCurrentPage('rarity');
  };

  const handleExport = async () => {
    logger.info('APP', 'User initiated export');
    try {
      if (containerRef.current && stats) {
        await exportPdf(containerRef.current, `Snobify_${profile}_${stats.meta.hash.slice(0, 8)}`);
        logger.info('APP', 'Export completed successfully');
      }
    } catch (err) {
      logger.error('APP', 'Export failed', {
        error: err instanceof Error ? err.message : String(err),
        errorStack: err instanceof Error ? err.stack : undefined
      });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setDebugPanelOpen(true);
        logger.info('APP', 'Debug panel opened via keyboard shortcut');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Render content based on state
  const renderContent = () => {
    if (loading) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          color: 'white'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div className="snob-avatar pulse" style={{ margin: '0 auto 24px' }}>
              <div style={{ fontSize: '3rem' }}></div>
            </div>
            <h2>The Snob is analyzing your taste...</h2>
            <p>This may take a moment for large datasets</p>
            <button
              className="btn btn-secondary"
              onClick={() => setDebugPanelOpen(true)}
              style={{ marginTop: '16px' }}
            >
              Open Debug Panel
            </button>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          color: 'white',
          padding: '40px'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <h2>Oops! The Snob encountered an error</h2>
            <p style={{ marginBottom: '24px' }}>{error}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn" onClick={() => setCurrentPage('welcome')}>
                Start Over
              </button>
              <button className="btn btn-secondary" onClick={() => setDebugPanelOpen(true)}>
                Debug Panel
              </button>
              <button className="btn btn-secondary" onClick={() => window.location.reload()}>
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div ref={containerRef} style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        backgroundColor: 'transparent',
      }}>
        {/* Connection Status */}
        <ConnectionStatusComponent showDetails={true} position="top-right" />

        {/* Debug Panel Toggle */}
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '80px',
          zIndex: 1000
        }}>
          <button
            onClick={() => setDebugPanelOpen(true)}
            style={{
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              cursor: 'pointer',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.9)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.7)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="Open Debug Panel (Ctrl+Shift+D)"
          >
            🐛
          </button>
        </div>

        {currentPage === 'welcome' && (
          <WelcomePage onGetStarted={handleGetStarted} />
        )}

        {currentPage === 'summary' && (
          <>
            {!stats && (
              <EmptyState
                title="No Data Available"
                description="We couldn't find any music data for your profile. Make sure your music files are properly imported."
                icon="🎵"
                action={{
                  text: "Refresh Data",
                  onClick: refresh,
                }}
              />
            )}
            {stats && (
              <SummaryDashboard stats={stats} onNext={handleNext} />
            )}
          </>
        )}

        {currentPage === 'rarity' && (
          <>
            {!stats && (
              <EmptyState
                title="No Data Available"
                description="We need your music data to analyze rarity patterns."
                icon="💎"
                action={{
                  text: "Refresh Data",
                  onClick: refresh,
                }}
              />
            )}
            {stats && (
              <RarityAnalysis
                stats={stats}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
          </>
        )}

        {currentPage === 'taste' && (
          <>
            {!stats && (
              <EmptyState
                title="No Data Available"
                description="We need your music data to build your taste profile."
                icon="🎨"
                action={{
                  text: "Refresh Data",
                  onClick: refresh,
                }}
              />
            )}
            {stats && (
              <TasteProfile
                stats={stats}
                onBack={handleBack}
                onExport={handleExport}
              />
            )}
          </>
        )}

        <DebugPanel
          isOpen={debugPanelOpen}
          onClose={() => setDebugPanelOpen(false)}
          debugInfo={debugInfo}
          onRefresh={refresh}
          onRetry={retry}
        />
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <style>{LoadingStyles}</style>

      {/* 3D Scene Background - Persistent */}
      <SceneContainer />

      {/* Content Overlay */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {renderContent()}

        <DebugPanel
          isOpen={debugPanelOpen}
          onClose={() => setDebugPanelOpen(false)}
          debugInfo={debugInfo}
          onRefresh={refresh}
          onRetry={retry}
        />
      </div>
    </ErrorBoundary>
  );
}