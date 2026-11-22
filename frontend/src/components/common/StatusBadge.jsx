import React from 'react';
import '../../styles/StatusBadge.css';

export const StatusBadge = ({ status = 'Completed' }) => {
  const normalized = status.toLowerCase();

  let variantClass = 'status-badge-completed';
  if (normalized === 'pending') {
    variantClass = 'status-badge-pending';
  } else if (normalized === 'processing') {
    variantClass = 'status-badge-processing';
  } else if (normalized === 'failed') {
    variantClass = 'status-badge-failed';
  } else if (normalized === 'active' || normalized === 'active candidate') {
    variantClass = 'status-badge-active';
  }

  return (
    <span className={`status-badge-root ${variantClass}`}>
      <span className="status-badge-dot" />
      {status}
    </span>
  );
};

export default StatusBadge;
