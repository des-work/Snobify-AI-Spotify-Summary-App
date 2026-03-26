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
import SetupPage from "./components/SetupPage";
import SnobRoast from "./components/SnobRoast";
import SummaryDashboard from "./components/SummaryDashboard";
import RarityAnalysis from "./components/RarityAnalysis";
import TasteProfile from "./components/TasteProfile";
import { exportPdf } from "./pdf";
import { exportCardPng } from "./export";
import { logger } from "./utils/debugLogger";

type AppPage = 'welcome' | 'setup' | 'roast' | 'summary' | 'rarity' | 'taste';

export default function App() {
  const [profile, setProfile] = useState("default");
  const [currentPage, setCurrentPage] = useState<AppPage>('welcome');
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use the enhanced data loader hook
  const {
    data: stats,
    loading,
    error,
    retry,
    refresh,
    reset,
    debugInfo,
  } = useStatsData(profile);

  useEffect(() => {
    logger.info('APP', 'App state updated', {
      profile,
      currentPage,
      userAgent: navigator.userAgent,
      url: window.location.href,
      debugInfo,
    });
  }, [profile, currentPage, debugInfo]);

  const handleGetStarted = () => {
    logger.info('APP', 'User navigating to setup page');
    setCurrentPage('setup');
  };

  const handleAnalyze = (chosenProfile: string) => {
    logger.info('APP', 'User starting analysis', { profile: chosenProfile });
    setProfile(chosenProfile);
    reset();
    setCurrentPage('roast'); // data loads while loading screen shows; roast begins when data is ready
  };

  const handleRoastComplete = () => {
    logger.info('APP', 'Roast sequence complete — entering dashboard');
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

  const handleHome = () => {
    logger.info('APP', 'User returned to home screen');
    setCurrentPage('welcome');
  };

  const handleNewAnalysis = () => {
    logger.info('APP', 'User starting a new analysis from nav');
    setCurrentPage('setup');
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
    // Welcome and Setup pages always render — they don't depend on data state
    if (currentPage === 'welcome') {
      return <WelcomePage onGetStarted={handleGetStarted} />;
    }

    if (currentPage === 'setup') {
      return (
        <SetupPage
          currentProfile={profile}
          onAnalyze={handleAnalyze}
          onBack={() => setCurrentPage('welcome')}
        />
      );
    }

    // Data-dependent pages: show loading/error gates
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
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '16px' }}>
              <button className="btn btn-secondary" onClick={() => setCurrentPage('setup')}>
                ← Back to Setup
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setDebugPanelOpen(true)}
              >
                Open Debug Panel
              </button>
            </div>
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
              <button className="btn" onClick={() => setCurrentPage('setup')}>
                ← Back to Setup
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

    // Roast sequence — cinematic, full-screen, no nav chrome
    if (currentPage === 'roast' && stats) {
      return (
        <SnobRoast
          stats={stats}
          profile={profile}
          onComplete={handleRoastComplete}
        />
      );
    }

    const pageLabels: Record<AppPage, string> = {
      welcome: 'Home',
      setup: 'Setup',
      roast: 'The Roast',
      summary: 'Your Profile',
      rarity: 'Rarity Analysis',
      taste: 'Taste Profile',
    };

    return (
      <div ref={containerRef} style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        backgroundColor: 'transparent',
      }}>
        {/* ── Persistent top navbar — always shown for data pages ── */}
        {(
          <nav style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 20px',
            background: 'rgba(15,15,25,0.75)',
            backdropFilter: 'blur(14px)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            gap: 12,
          }}>
            {/* Left — Home + New Analysis buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleHome}
                title="Return to home screen"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(255,255,255,0.1)', color: 'white',
                  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10,
                  padding: '7px 14px', cursor: 'pointer', fontSize: 14,
                  fontWeight: 600, transition: 'all 0.2s ease', whiteSpace: 'nowrap',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.22)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                🏠 Home
              </button>
              <button
                onClick={handleNewAnalysis}
                title="Change profile or start a new analysis"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(102,126,234,0.25)', color: 'white',
                  border: '1px solid rgba(102,126,234,0.5)', borderRadius: 10,
                  padding: '7px 14px', cursor: 'pointer', fontSize: 14,
                  fontWeight: 600, transition: 'all 0.2s ease', whiteSpace: 'nowrap',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = 'rgba(102,126,234,0.45)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'rgba(102,126,234,0.25)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                ＋ New Analysis
              </button>
            </div>

            {/* Centre — breadcrumb */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: 'rgba(255,255,255,0.55)',
              overflow: 'hidden',
            }}>
              {(['setup', 'summary', 'rarity', 'taste'] as AppPage[]).map((page, i, arr) => (
                <span key={page} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      color: currentPage === page ? 'white' : 'rgba(255,255,255,0.45)',
                      fontWeight: currentPage === page ? 700 : 400,
                      cursor: currentPage === page ? 'default' : 'pointer',
                      transition: 'color 0.2s',
                    }}
                    onClick={() => {
                      const order: AppPage[] = ['welcome', 'setup', 'roast', 'summary', 'rarity', 'taste'];
                      if (order.indexOf(page) <= order.indexOf(currentPage)) setCurrentPage(page);
                    }}
                  >
                    {pageLabels[page]}
                  </span>
                  {i < arr.length - 1 && <span style={{ opacity: 0.3 }}>›</span>}
                </span>
              ))}
            </div>

            {/* Right — Refresh + Debug buttons */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={() => { refresh(); }}
                title="Reload data from server"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 10,
                  padding: '7px 12px',
                  cursor: 'pointer',
                  fontSize: 14,
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                🔄
              </button>
              <button
                onClick={() => setDebugPanelOpen(true)}
                title="Open Debug Panel (Ctrl+Shift+D)"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 10,
                  padding: '7px 12px',
                  cursor: 'pointer',
                  fontSize: 14,
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                🐛
              </button>
            </div>
          </nav>
        )}

        {/* Push page content down when navbar is showing */}
        <div style={{ height: 58 }} />

        {/* Connection Status */}
        <ConnectionStatusComponent showDetails={true} position="top-right" />

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
      </div>
    </ErrorBoundary>
  );
}