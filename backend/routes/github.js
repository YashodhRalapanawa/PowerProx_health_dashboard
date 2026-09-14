import express from 'express';

const router = express.Router();

/**
 * GET /api/github-status
 * Temporary stub endpoint returning repository deployment statuses.
 * Real GitHub Octokit integration will be implemented in the next phase.
 */
router.get('/', (req, res) => {
  // Stubbed repository status dataset
  const statuses = [
    {
      repo: 'powerprox-frontend',
      latestCommit: 'a1b2c3d',
      deployedCommit: 'a1b2c3d',
      status: 'up-to-date'
    },
    {
      repo: 'powerprox-backend',
      latestCommit: 'e4f5g6h',
      deployedCommit: 'e4f5g6h',
      status: 'up-to-date'
    },
    {
      repo: 'solar-dashboard',
      latestCommit: '7i8j9k0',
      deployedCommit: '3m4n5p6',
      status: 'pending'
    },
    {
      repo: 'asset-overview-service',
      latestCommit: 'b8c9d0e',
      deployedCommit: 'b8c9d0e',
      status: 'up-to-date'
    },
    {
      repo: 'fault-logging-system',
      latestCommit: 'f1g2h3i',
      deployedCommit: 'd4e5f6g',
      status: 'pending'
    }
  ];

  res.json(statuses);
});

export default router;
