/**
 * Determines indicator color class based on resource utilization percentage.
 *
 * @param {number} value
 * @returns {string} CSS color class
 */
function getProgressColorClass(value) {
  if (value >= 85) return 'metric-critical';
  if (value >= 70) return 'metric-warning';
  return 'metric-normal';
}

/**
 * HealthBar Component
 * Horizontal telemetry bar displaying host server health metrics:
 * - CPU load percentage & progress bar
 * - RAM utilization percentage & progress bar
 * - Disk storage percentage & progress bar
 * - System uptime string
 *
 * @param {{
 *   health: { cpu: number, ram: number, disk: number, uptime: string } | null
 * }} props
 */
export function HealthBar({ health }) {
  if (!health) {
    return (
      <div className="health-bar health-bar-loading">
        <span className="health-bar-placeholder">Gathering host telemetry...</span>
      </div>
    );
  }

  const { cpu = 0, ram = 0, disk = 0, uptime = 'N/A' } = health;

  const metrics = [
    { label: 'CPU', value: cpu, unit: '%' },
    { label: 'RAM', value: ram, unit: '%' },
    { label: 'Disk', value: disk, unit: '%' }
  ];

  return (
    <div className="health-bar">
      <div className="health-metrics">
        {metrics.map((m) => {
          const colorClass = getProgressColorClass(m.value);
          return (
            <div key={m.label} className="metric-item">
              <div className="metric-header">
                <span className="metric-label">{m.label}</span>
                <span className={`metric-value ${colorClass}`}>
                  {m.value}{m.unit}
                </span>
              </div>
              <div className="progress-track" aria-hidden="true">
                <div
                  className={`progress-fill ${colorClass}`}
                  style={{ width: `${Math.min(Math.max(m.value, 0), 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="uptime-badge">
        <span className="uptime-label">Uptime:</span>
        <span className="uptime-value">{uptime}</span>
      </div>
    </div>
  );
}

export default HealthBar;
