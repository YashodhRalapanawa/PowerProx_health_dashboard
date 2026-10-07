import express from 'express';
import { Octokit } from '@octokit/rest';
import fs from 'node:fs/promises';
import repos from '../config/repos.js';
import dotenv from 'dotenv';
import { fetchRepositoryStatus, compareBaseline } from '../services/githubStatus.js';

dotenv.config();
const router = express.Router();
const client = new Octokit({ auth: process.env.GITHUB_TOKEN, request: { timeout: 10000 } });
const baselineFile = new URL('../deployed_commits.json', import.meta.url);
const TTL = 5 * 60 * 1000;
let cache = null;
let cachedAt = 0;
let pending = null;

export async function readDeployedCommits() {
  try { return JSON.parse(await fs.readFile(baselineFile, 'utf8')); }
  catch { return {}; }
}
export async function writeDeployedCommits(data) {
  await fs.writeFile(baselineFile, JSON.stringify(data, null, 2), 'utf8');
}

router.get('/', async (_req, res) => {
  try {
    if (!cache || Date.now() - cachedAt >= TTL) {
      if (!pending) pending = Promise.all(repos.map(config => fetchRepositoryStatus(client, config)))
        .then(data => { cache = data; cachedAt = Date.now(); })
        .finally(() => { pending = null; });
      await pending;
    }
    const baseline = await readDeployedCommits();
    res.json(cache.map(item => ({ ...compareBaseline(item, baseline), refreshIntervalSeconds: TTL / 1000 })));
  } catch {
    res.status(503).json({ error: 'GitHub data unavailable' });
  }
});
export default router;
