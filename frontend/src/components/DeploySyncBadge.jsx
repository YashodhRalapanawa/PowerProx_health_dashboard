/**
 * DeploySyncBadge Component
 * Displays GitHub deployment synchronization status:
 * - Green "Up to date" if deploy status is "up-to-date"
 * - Orange "Update pending" if deploy status is "pending"
 *
 * @param {{
 *   status: 'up-to-date' | 'pending' | string,
 *   latestCommit?: string,
 *   deployedCommit?: string,
 *   latestCommitMessage?: string
 * }} props
 */
export function DeploySyncBadge({ status, latestCommit, deployedCommit, latestCommitMessage }) {
  if (!status) return null;

  const isUpToDate = status === 'up-to-date';

  return (
    <span
      className={`deploy-badge ${isUpToDate ? 'deploy-synced' : 'deploy-pending'}`}
      title={
        latestCommitMessage ||
        (latestCommit && deployedCommit
          ? `Deployed: ${deployedCommit} | Latest: ${latestCommit}`
          : undefined)
      }
    >
      <svg
        className="deploy-icon"
        viewBox="0 0 16 16"
        fill="currentColor"
        width="12"
        height="12"
        aria-hidden="true"
      >
        {isUpToDate ? (
          // Checkmark / git-commit synced icon
          <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
        ) : (
          // Pending / sync arrow icon
          <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .655-.835Zm11.89-1.95a.75.75 0 0 1-.834-.656 5.5 5.5 0 0 0-9.592-2.97l1.204 1.204a.25.25 0 0 1-.177.427H.75a.25.25 0 0 1-.25-.25V.114a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-.655.835Z" />
        )}
      </svg>
      <span>{isUpToDate ? 'Up to date' : 'Update pending'}</span>
    </span>
  );
}

export default DeploySyncBadge;
