import express from 'express';
import si from 'systeminformation';

const router = express.Router();

/**
 * Formats uptime in seconds to a human-friendly string (e.g., "5 days 3 hrs" or "4 hrs 12 mins").
 *
 * @param {number} seconds - Total uptime in seconds
 * @returns {string} Formatted uptime string
 */
function formatUptime(seconds) {
  const totalSeconds = Math.floor(seconds);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const parts = [];
  if (days > 0) {
    parts.push(`${days} day${days > 1 ? 's' : ''}`);
  }
  if (hours > 0 || (days > 0 && minutes === 0)) {
    parts.push(`${hours} hr${hours > 1 ? 's' : ''}`);
  }
  if (days === 0) {
    parts.push(`${minutes} min${minutes !== 1 ? 's' : ''}`);
  }

  return parts.join(' ') || '0 mins';
}

/**
 * GET /api/health
 * Returns host system metrics: CPU load, RAM usage, Disk usage, and uptime.
 */
router.get('/', async (req, res) => {
  try {
    // Gather system information in parallel
    const [loadData, memData, fsData, timeData] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.time()
    ]);

    // CPU percentage
    const cpuPercent = Math.round(loadData.currentLoad * 10) / 10;

    // RAM percentage used (prefer available if present, fallback to used)
    const usedRam = memData.available ? memData.total - memData.available : memData.used;
    const ramPercent = memData.total > 0
      ? Math.round((usedRam / memData.total) * 1000) / 10
      : 0;

    // Disk percentage used (aggregate or primary disk)
    let diskPercent = 0;
    if (Array.isArray(fsData) && fsData.length > 0) {
      const primaryMount = fsData.find((fs) => fs.mount === '/') || fsData[0];
      diskPercent = Math.round((primaryMount.use || 0) * 10) / 10;
    }

    // Uptime formatted string
    const uptime = formatUptime(timeData.uptime);

    res.json({
      cpu: cpuPercent,
      ram: ramPercent,
      disk: diskPercent,
      uptime
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve system health metrics', message: error.message });
  }
});

export default router;
