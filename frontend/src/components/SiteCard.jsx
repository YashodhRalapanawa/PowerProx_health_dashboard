import StatusBadge from './StatusBadge';
const labels = { passed: 'Passed', failed: 'Failed', running: 'In progress', none: 'No runs for this commit', unavailable: 'Unavailable', partial: 'Partial results', other: 'Completed · review results' };
function time(value) { return value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleString() : 'Not available'; }
export function SiteCard({ site, githubStatus = [] }) {
  const repo = githubStatus.find(item => item.site === site.name);
  const available = repo?.githubState === 'available';
  const build = repo?.build;
  return <article className={`site-card ${site.status === 'working' ? 'card-operational' : 'card-issue'}`}>
    <div className="site-card-header"><div><p className="eyebrow">PRODUCTION SERVICE</p><h3 className="site-name">{site.name}</h3></div><StatusBadge status={site.status} /></div>
    <p className="site-summary">{site.summary}</p>
    <dl className="service-observations"><div><dt>Response time</dt><dd>{Number.isFinite(site.responseTimeMs) ? `${site.responseTimeMs} ms` : 'No response'}</dd></div><div><dt>HTTP response</dt><dd>{site.httpStatus || 'Unavailable'}</dd></div></dl>
    <p className="freshness">Last checked: {time(site.checkedAt)}</p>
    <section className="commit-panel" aria-label={`${site.name} latest commit`}>
      <div className="commit-heading"><h4>Latest commit</h4><span className="branch-chip">{repo?.branch || 'Branch unavailable'}</span></div>
      {available ? <>
        <p className="commit-message">{repo.latestCommitMessage || 'No commit message'}</p>
        <div className="commit-author"><span className="author-avatar" aria-hidden="true">{(repo.author || '?').slice(0, 1).toUpperCase()}</span><div><strong>{repo.author || 'Unknown author'}</strong>{repo.authorLogin && <span className="author-login"> @{repo.authorLogin}</span>}<p className="freshness">Committed {time(repo.committedAt)}</p></div></div>
        <a className="commit-link" href={repo.commitUrl} target="_blank" rel="noopener noreferrer">View commit <code>{repo.latestCommit}</code> ↗</a>
      </> : <p className="data-unavailable">{repo?.githubState === 'empty' ? 'No commits on this branch yet.' : 'GitHub data unavailable. Service availability is checked separately.'}</p>}
      <p className="freshness">GitHub checked: {time(repo?.checkedAt)}</p>
    </section>
    <section className="workflow-panel" aria-label={`${site.name} workflow status`}>
      <div className="commit-heading"><h4>Build / workflows</h4><span className={`workflow-status workflow-${build?.state || 'unavailable'}`}>{labels[build?.state] || 'Unavailable'}</span></div>
      {!!build?.runs?.length && <ul className="workflow-list">{build.runs.map((run, i) => <li key={`${run.url}-${i}`}><a href={run.url} target="_blank" rel="noopener noreferrer">{run.name || 'Workflow'} ↗</a><span>{(run.conclusion || run.status).replaceAll('_', ' ')}</span></li>)}</ul>}
      <p className="freshness">Results for the latest commit; not deployment confirmation.</p>
    </section>
    <div className="site-card-footer"><div className="baseline-note"><span>Configured baseline</span><strong>{!available || repo.status === 'unknown' ? 'Unknown' : repo.status === 'up-to-date' ? 'Matches latest commit' : 'Differs from latest commit'}</strong></div><a href={site.url} target="_blank" rel="noopener noreferrer" className="visit-button">Visit site ↗</a></div>
  </article>;
}
export default SiteCard;
