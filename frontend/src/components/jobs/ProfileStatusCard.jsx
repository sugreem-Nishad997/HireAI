import React from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import '../../styles/ProfileStatusCard.css';

export const ProfileStatusCard = ({ completion = 75 }) => {
  const navigate = useNavigate();

  return (
    <div className="profile-status-card">
      <div>
        <div className="profile-status-header">
          <span className="profile-status-title">Profile Status</span>
          <span className="profile-status-percentage">{completion}%</span>
        </div>

        <div className="profile-status-progress-track">
          <div
            className="profile-status-progress-fill"
            style={{ width: `${completion}%` }}
          />
        </div>

        <p className="profile-status-text">
          Complete your profile to appear in 2x more search results.
        </p>
      </div>

      <button
        onClick={() => navigate('/profile')}
        className="profile-status-complete-btn"
      >
        <span>Complete Profile</span>
        <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
      </button>
    </div>
  );
};

export default ProfileStatusCard;
