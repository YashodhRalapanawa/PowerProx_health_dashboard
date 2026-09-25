import express from 'express';
import { Octokit } from '@octokit/rest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import repos from '../config/repos.js';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

const router = express.Router();

// Initialize Octokit client with GitHub token
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

// Path to deployed_commits.json file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEPLOYED_COMMITS_PATH = path.resolve(__dirname, '../deployed_commits.json');

/**
 * Helper to read deployed commits mapping from disk.
 *
 * @returns {Promise<Record<string, string>>}
 */
export async function readDeployedCommits() {
  try {
    const raw = await fs.readFile(DEPLOYED_COMMITS_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.warn('[GitHub Router] Could not read deployed_commits.json, falling back to empty map:', error.message);
    return {};
  }
}

/**
 * Helper to write deployed commits mapping to disk.
 *
 * @param {Record<string, string>} data
 * @returns {Promise<void>}
 */
export async function writeDeployedCommits(data) {
  try {
    await fs.writeFile(DEPLOYED_COMMITS_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('[GitHub Router] Failed to write deployed_commits.json:', error.message);
  }
}

// In-memory cache for GitHub API results (5 minutes TTL to respect rate limits)
const CACHE_TTL_MS = 5 * 60 * 1000;
let commitCache = {
  data: null, // Array of { site, repo, latestCommit, latestCommitMessage }
  cachedAt: 0
};

/**
 * Formats a raw commit message to its first line, truncated to 60 characters with "...".
 *
 * @param {string} [rawMessage]
 * @returns {string}
 */
function formatCommitMessage(rawMessage) {
  if (!rawMessage || typeof rawMessage !== 'string') return '';
  const firstLine = rawMessage.split(/\r?\n/)[0].trim();
  return firstLine.length > 60 ? `${firstLine.slice(0, 60)}...` : firstLine;
}

/**
 * GET /api/github-status
 * Fetches the latest commit on default branch for each configured repository,
 * compares against deployed_commits.json, and returns deployment synchronization status.
 * Results from GitHub are cached in memory for 5 minutes.
 */
router.get('/', async (req, res) => {
  try {
    const now = Date.now();
    let latestCommits = commitCache.data;

    // Check if in-memory cache is valid and fresh
    const isCacheValid = latestCommits && (now - commitCache.cachedAt < CACHE_TTL_MS);

    if (!isCacheValid) {
      // Query GitHub API concurrently for all repositories using Promise.allSettled
      const commitResults = await Promise.allSettled(
        repos.map(async (config) => {
          try {
            const { data } = await octokit.repos.listCommits({
              owner: config.owner,
              repo: config.repo,
              per_page: 1
            });

            const firstCommit = data?.[0];
            const sha = firstCommit?.sha;
            const message = firstCommit?.commit?.message;
            return {
              site: config.site,
              repo: config.repo,
              latestCommit: sha ? sha.slice(0, 7) : 'unknown',
              latestCommitMessage: formatCommitMessage(message)
            };
          } catch (err) {
            console.warn(`[GitHub Router] Failed to get latest commit for ${config.owner}/${config.repo}:`, err.message);
            return {
              site: config.site,
              repo: config.repo,
              latestCommit: 'unknown',
              latestCommitMessage: ''
            };
          }
        })
      );

      // Extract results from settled promises
      latestCommits = commitResults.map((result, idx) => {
        if (result.status === 'fulfilled') {
          return result.value;
        }
        return {
          site: repos[idx].site,
          repo: repos[idx].repo,
          latestCommit: 'unknown',
          latestCommitMessage: ''
        };
      });

      // Update in-memory cache only if at least one repository fetched successfully
      const hasValidCommit = latestCommits.some((c) => c.latestCommit !== 'unknown');
      if (hasValidCommit) {
        commitCache = {
          data: latestCommits,
          cachedAt: now
        };
      }
    }

    // Read latest deployed commits from disk
    const deployedMap = await readDeployedCommits();

    // Assemble final response array with deployment status comparison
    const responseData = latestCommits.map((item) => {
      const rawDeployed = deployedMap[item.repo] || 'unknown';
      const deployedCommit = rawDeployed !== 'unknown' ? rawDeployed.slice(0, 7) : 'unknown';

      // Status is "up-to-date" only when deployed commit is known, latest commit is known, and both match
      const isUpToDate =
        deployedCommit !== 'unknown' &&
        item.latestCommit !== 'unknown' &&
        deployedCommit.toLowerCase() === item.latestCommit.toLowerCase();

      return {
        site: item.site,
        repo: item.repo,
        latestCommit: item.latestCommit,
        latestCommitMessage: item.latestCommitMessage || '',
        deployedCommit,
        status: isUpToDate ? 'up-to-date' : 'pending'
      };
    });

    res.json(responseData);
  } catch (error) {
    console.error('[GitHub Router] Unexpected error in /api/github-status:', error);
    res.status(500).json({ error: 'Failed to process GitHub deployment status', message: error.message });
  }
});

export default router;
