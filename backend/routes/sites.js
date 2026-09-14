import express from 'express';
import axios from 'axios';
import https from 'node:https';
import sites from '../config/sites.js';

const router = express.Router();

// Allow self-signed or internal SSL certificates for monitoring
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

/**
 * GET /api/sites
 * Checks the health of all configured sites with a 5-second timeout.
 * Returns an array of site objects with their current status ("working" | "down").
 */
router.get('/', async (req, res) => {
  try {
    // Ping all sites concurrently using Promise.allSettled to prevent single-site failures from breaking the batch
    const results = await Promise.allSettled(
      sites.map(async (site) => {
        try {
          await axios.get(site.url, {
            timeout: 5000,
            httpsAgent,
            // Treat status codes below 500 (including 2xx, 3xx, and 401/403) as the server responding
            validateStatus: (status) => status < 500
          });

          return {
            name: site.name,
            url: site.url,
            summary: site.summary,
            status: 'working'
          };
        } catch {
          return {
            name: site.name,
            url: site.url,
            summary: site.summary,
            status: 'down'
          };
        }
      })
    );

    const data = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return {
        name: sites[index].name,
        url: sites[index].url,
        summary: sites[index].summary,
        status: 'down'
      };
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check sites status', message: error.message });
  }
});

export default router;
