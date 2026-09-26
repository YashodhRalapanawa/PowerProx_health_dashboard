import SiteCard from './SiteCard';

/**
 * SiteGrid Component
 * Renders a responsive CSS grid of monitored site cards.
 *
 * @param {{
 *   sites: Array<{ name: string, url: string, summary: string, status: string }>,
 *   githubStatus?: Array<Object>
 * }} props
 */
export function SiteGrid({ sites = [], githubStatus = [] }) {
  if (!sites.length) {
    return (
      <div className="empty-state">
        <p>No sites currently configured for monitoring.</p>
      </div>
    );
  }

  return (
    <div className="site-grid">
      {sites.map((site) => (
        <SiteCard
          key={site.name}
          site={site}
          githubStatus={githubStatus}
        />
      ))}
    </div>
  );
}

export default SiteGrid;
