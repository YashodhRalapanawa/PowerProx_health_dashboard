import React from 'react';
import StatusBadge from './StatusBadge';
import DeploySyncBadge from './DeploySyncBadge';

/**
 * SiteCard Component
 * Displays the operational card for a single service/site:
 * - Site name and summary description
 * - StatusBadge (WORKING / DOWN)
 * - DeploySyncBadge (Up to date / Update pending, matched against GitHub repo)
 * - External link button to "Visit Site" in a new tab
 *
 * @param {{
 *   site: { name: string, url: string, summary: string, status: string },
 *   githubStatus?: Array<{ repo: string, latestCommit: string, latestCommitMessage?: string, deployedCommit: string, status: string }>
 * }} props
 */
export function SiteCard({ site, githubStatus = [] }) {
  // Match site name directly or fallback to normalized repo name
  const matchedRepo = githubStatus.find((item) => {
    if (!site?.name) return false;
    if (item?.site && item.site.toLowerCase() === site.name.toLowerCase()) return true;
    if (!item?.repo) return false;
    const cleanSite = site.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanRepo = item.repo.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleanRepo.includes(cleanSite) || cleanSite.includes(cleanRepo);
  });

  const isWorking = site.status === 'working';

  return (
    <div className={`site-card ${isWorking ? 'card-operational' : 'card-issue'}`}>
      <div className="site-card-header">
        <h3 className="site-name">{site.name}</h3>
        <StatusBadge status={site.status} />
      </div>

      <p className="site-summary">{site.summary}</p>

      <div className="site-card-footer">
        <div className="site-card-meta">
          {matchedRepo ? (
            <DeploySyncBadge
              status={matchedRepo.status}
              latestCommit={matchedRepo.latestCommit}
              deployedCommit={matchedRepo.deployedCommit}
              latestCommitMessage={matchedRepo.latestCommitMessage}
            />
          ) : (
            <span className="site-url-hint">{new URL(site.url).host}</span>
          )}
        </div>

        <a
          href={site.url}
          target="_blank"
          rel="noopener noreferrer"
          className="visit-button"
        >
          <span>Visit Site</span>
          <svg
            className="external-icon"
            viewBox="0 0 20 20"
            fill="currentColor"
            width="14"
            height="14"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z"
              clipRule="evenodd"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}

export default SiteCard;
