import { useDashboardData } from './hooks/useDashboardData';
import HealthBar from './components/HealthBar';
import SiteGrid from './components/SiteGrid';
import './App.css';

/**
 * Main Application Component
 * SLT Production Monitoring Dashboard
 */
function App() {
  const { sites, health, githubStatus, loading, error, lastUpdated, refetch } = useDashboardData();

  // Summary counts
  const totalSites = sites.length;
  const downSites = sites.filter((s) => s.status !== 'working').length;
  const allWorking = totalSites > 0 && downSites === 0;

  return (
    <div className="dashboard-layout">
      {/* Top Header */}
      <header className="dashboard-header">
        <div className="header-container">
          <div className="header-brand">
            <div className="brand-title-row">
              <span className="brand-logo-glow" aria-hidden="true" />
              <h1 className="brand-title">SLT Production Monitoring</h1>
            </div>
            <div className="header-status-pill">
              {loading && !sites.length ? (
                <span className="pill-checking">Connecting to telemetry...</span>
              ) : allWorking ? (
                <span className="pill-all-good">
                  <span className="pulse-dot green" /> All Systems Operational ({totalSites}/{totalSites})
                </span>
              ) : (
                <span className="pill-has-issue">
                  <span className="pulse-dot red" /> {downSites} of {totalSites} Systems Degraded
                </span>
              )}
            </div>
          </div>

          {/* Telemetry Host Health Bar */}
          <div className="header-telemetry">
            <HealthBar health={health} />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="dashboard-main">
        <div className="content-container">
          {/* Controls & Refresh Bar */}
          <div className="dashboard-toolbar">
            <div className="toolbar-left">
              <h2 className="section-title">Monitored Services</h2>
              <span className="service-count-tag">{totalSites} endpoints</span>
            </div>

            <div className="toolbar-right">
              {lastUpdated && (
                <span className="last-updated-text">
                  Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
              <button
                type="button"
                className="refresh-button"
                onClick={() => refetch()}
                aria-label="Refresh dashboard data"
                title="Refresh now"
              >
                <svg
                  className={`refresh-icon ${loading ? 'spin' : ''}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  width="16"
                  height="16"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Error Message Banner */}
          {error && (
            <div className="error-banner" role="alert">
              <svg
                className="error-icon"
                viewBox="0 0 20 20"
                fill="currentColor"
                width="18"
                height="18"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="error-content">
                <strong>Connection Alert:</strong> {error}
              </div>
              <button
                type="button"
                className="error-retry-btn"
                onClick={() => refetch()}
              >
                Retry
              </button>
            </div>
          )}

          {/* Initial Loading Skeleton */}
          {loading && !sites.length ? (
            <div className="loading-state">
              <div className="spinner" aria-hidden="true" />
              <p>Polling production services...</p>
            </div>
          ) : (
            <SiteGrid
              sites={sites}
              githubStatus={githubStatus}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <div className="footer-container">
          <p className="footer-text">
            PowerProx Telemetry Engine &bull; Auto-refreshes every 30 seconds
          </p>
          <p className="footer-subtext">
            Sri Lanka Telecom Internal Network Monitoring
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
