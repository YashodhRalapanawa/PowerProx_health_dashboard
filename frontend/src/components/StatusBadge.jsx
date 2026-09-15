import React from 'react';

/**
 * StatusBadge Component
 * Displays a badge with status text and an animated indicator dot.
 * - Green "WORKING" if status is "working"
 * - Red "DOWN" if status is "down"
 *
 * @param {{ status: 'working' | 'down' | string }} props
 */
export function StatusBadge({ status }) {
  const isWorking = status === 'working';

  return (
    <span
      className={`status-badge ${isWorking ? 'status-working' : 'status-down'}`}
      role="status"
      aria-label={`Site status: ${isWorking ? 'Working' : 'Down'}`}
    >
      <span className="status-dot" aria-hidden="true" />
      <span className="status-text">{isWorking ? 'WORKING' : 'DOWN'}</span>
    </span>
  );
}

export default StatusBadge;
