import React from 'react';
import StayCurrentPortraitRoundedIcon from '@mui/icons-material/StayCurrentPortraitRounded';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import { mockRecruiterData } from '../../data/mockRecruiterData';
import '../../styles/SourcesBreakdown.css';

export const SourcesBreakdown = () => {
  const { sources } = mockRecruiterData;

  return (
    <div className="sources-card">
      {/* Header */}
      <div className="sources-header">
        <div className="sources-header-left">
          <div className="sources-icon-box">
            <StayCurrentPortraitRoundedIcon sx={{ fontSize: 16 }} />
          </div>
          <h3 className="sources-title">
            Applicant Sources Breakdown
          </h3>
        </div>

        <button className="sources-more-btn">
          <MoreHorizRoundedIcon sx={{ fontSize: 20 }} />
        </button>
      </div>

      {/* Progress Bars */}
      <div className="sources-list">
        {sources.map((src, idx) => (
          <div key={idx} className="sources-item">
            <div className="sources-item-row">
              <span className="sources-name">{src.name}</span>
              <span className="sources-percentage">{src.percent}%</span>
            </div>

            <div className="sources-track">
              <div
                className="sources-fill"
                style={{
                  width: `${src.percent}%`,
                  backgroundColor: src.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SourcesBreakdown;
