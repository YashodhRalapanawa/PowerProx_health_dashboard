export async function fetchRepositoryStatus(client, config) {
  const params = { owner: config.owner, repo: config.repo };
  const result = { site: config.site, repo: config.repo, repoUrl: `https://github.com/${config.owner}/${config.repo}`, branch: config.branch || null, latestCommit: 'unknown', latestCommitMessage: '', githubState: 'unavailable', checkedAt: new Date().toISOString(), build: { state: 'unavailable', runs: [] } };
  try {
    const branch = config.branch || (await client.repos.get(params)).data.default_branch;
    result.branch = branch;
    const { data } = await client.repos.listCommits({ ...params, sha: branch, per_page: 1 });
    const commit = data[0];
    if (!commit) return { ...result, githubState: 'empty' };
    Object.assign(result, {
      githubState: 'available', latestCommit: commit.sha.slice(0, 7), latestCommitSha: commit.sha,
      latestCommitMessage: commit.commit.message.split(/\r?\n/)[0],
      author: commit.commit.author?.name || commit.author?.login || 'Unknown author',
      authorLogin: commit.author?.login || null,
      committedAt: commit.commit.committer?.date || commit.commit.author?.date || null,
      commitUrl: commit.html_url
    });
    try {
      // Only runs for this commit and branch; do not report an older build as current.
      const { data: builds } = await client.actions.listWorkflowRunsForRepo({ ...params, branch, head_sha: commit.sha, per_page: 100 });
      const latestByWorkflow = new Map();
      for (const run of builds.workflow_runs) {
        if (run.head_sha !== commit.sha || run.head_branch !== branch) continue;
        const prior = latestByWorkflow.get(run.workflow_id);
        if (!prior || new Date(run.created_at) > new Date(prior.created_at) || (run.id === prior.id && run.run_attempt > prior.run_attempt)) latestByWorkflow.set(run.workflow_id, run);
      }
      const runs = [...latestByWorkflow.values()].map(run => ({ name: run.name, status: run.status, conclusion: run.conclusion, url: run.html_url }));
      const failed = runs.some(run => ['failure', 'timed_out', 'action_required', 'startup_failure'].includes(run.conclusion));
      const active = runs.some(run => run.status !== 'completed');
      const state = builds.total_count > 100 ? 'partial' : !runs.length ? 'none' : failed ? 'failed' : active ? 'running' : runs.every(run => run.conclusion === 'success') ? 'passed' : 'other';
      result.build = { state, runs };
    } catch {
      // Actions permission failures must not hide commit data or mark the site down.
      result.build = { state: 'unavailable', runs: [] };
    }
  } catch {
    result.githubState = 'unavailable';
  }
  return result;
}

export function compareBaseline(item, mapping) {
  const baseline = mapping[item.repo];
  const known = typeof baseline === 'string' && /^[a-f0-9]{7,40}$/i.test(baseline);
  const status = !known || !item.latestCommitSha ? 'unknown' : item.latestCommitSha.toLowerCase().startsWith(baseline.toLowerCase()) ? 'up-to-date' : 'pending';
  return { ...item, deployedCommit: known ? baseline.slice(0, 7) : 'unknown', status, comparisonSource: 'configured-baseline' };
}
