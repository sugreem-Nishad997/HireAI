import React, { useState } from 'react';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import { mockRecruiterData } from '../../data/mockRecruiterData';
import '../../styles/ApplicationsBarChart.css';

export const ApplicationsBarChart = () => {
  const { applicationsChartData } = mockRecruiterData;
  const [hoveredIdx, setHoveredIdx] = useState(3); // default highlight UI/UX Designer

  const maxVal = 1400;

  return (
    <div className="app-chart-card">
      {/* Header */}
      <div className="app-chart-header">
        <div className="app-chart-header-left">
          <div className="app-chart-icon-box">
            <BarChartRoundedIcon sx={{ fontSize: 18 }} />
          </div>
          <h3 className="app-chart-title">Applications Received</h3>
        </div>

        <button className="app-chart-more-btn">
          <MoreHorizRoundedIcon sx={{ fontSize: 20 }} />
        </button>
      </div>

      {/* Chart Canvas Area */}
      <div className="app-chart-canvas-area">
        {/* Y Axis Labels */}
        <div className="app-chart-y-axis">
          <span>2000</span>
          <span>1000</span>
          <span>500</span>
          <span>100</span>
          <span>0</span>
        </div>

        {/* Bars Container */}
        <div className="app-chart-bars-wrap">
          {applicationsChartData.map((item, idx) => {
            const viewsHeight = (item.views / maxVal) * 180;
            const applicantsHeight = (item.applicants / maxVal) * 180;
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                className="app-chart-bar-col"
              >
                {/* Tooltip on Highlighted Bar */}
                {isHovered && (
                  <div
                    className="app-chart-tooltip"
                    style={{ bottom: `${viewsHeight + 10}px` }}
                  >
                    <div className="app-chart-tooltip-title">
                      {item.fullTitle || item.role}
                    </div>
                    <div className="app-chart-tooltip-row">
                      <span>Views:</span>
                      <strong style={{ color: '#0F172A' }}>{item.views.toLocaleString()}</strong>
                    </div>
                    <div className="app-chart-tooltip-row">
                      <span>Applicants:</span>
                      <strong style={{ color: '#2563EB' }}>
                        {item.applicants} ({Math.round((item.applicants / item.views) * 100)}%)
                      </strong>
                    </div>
                  </div>
                )}

                {/* Stacked/Grouped Bars */}
                <div
                  className="app-chart-bar-outer"
                  style={{
                    height: `${viewsHeight}px`,
                    backgroundColor: isHovered ? '#DBEAFE' : '#EFF6FF',
                    border: isHovered ? '1px solid #2563EB' : 'none',
                  }}
                >
                  <div
                    className="app-chart-bar-inner"
                    style={{ height: `${applicantsHeight}px` }}
                  />
                </div>

                {/* X Axis Label */}
                <span
                  className="app-chart-x-label"
                  style={{
                    color: isHovered ? '#2563EB' : '#94A3B8',
                    fontWeight: isHovered ? 600 : 500,
                  }}
                >
                  {item.role}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="app-chart-legend">
        <div className="app-chart-legend-item">
          <span className="app-chart-dot-applicants" />
          <span>Applicants</span>
        </div>

        <div className="app-chart-legend-item">
          <span className="app-chart-dot-viewed" />
          <span>Viewed</span>
        </div>
      </div>
    </div>
  );
};

export default ApplicationsBarChart;
