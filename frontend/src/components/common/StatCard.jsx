import React from 'react';
import '../../styles/StatCard.css';

export const StatCard = ({
  title,
  value,
  icon: Icon,
  iconBg = '#EFF6FF',
  iconColor = '#2563EB',
  subtext,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`stat-card-container ${onClick ? 'stat-card-clickable' : ''}`}
    >
      <div className="stat-card-header">
        <div
          className="stat-card-icon-box"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          {Icon && <Icon sx={{ fontSize: 20 }} />}
        </div>
        <span className="stat-card-title">{title}</span>
      </div>

      <div className="stat-card-body">
        <span className="stat-card-value">{value}</span>
        {subtext && <span className="stat-card-subtext">{subtext}</span>}
      </div>
    </div>
  );
};

export default StatCard;
