import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import BusinessCenterRoundedIcon from '@mui/icons-material/BusinessCenterRounded';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from '../../context/AuthContext';
import '../../styles/RecruiterHeader.css';

export const RecruiterHeader = ({ activeJobs, loading }) => {
  const { user } = useAuth();

  return (
    <div className="recruiter-header-root">
      {/* Title / Company */}
      <div className="recruiter-header-left">
        <h1 className="recruiter-header-title">
          Dashboard
        </h1>

        <div className="recruiter-company-badge">
          <div className="recruiter-company-icon">
            <BusinessCenterRoundedIcon sx={{ fontSize: 14 }} />
          </div>
          <div className="recruiter-company-name">
            {user?.name || 'Recruiter'}
          </div>
          <span className="recruiter-company-jobs-count">
            ({loading
              ? <CircularProgress size={13} aria-label="Loading active jobs" />
              : activeJobs ?? 'N/A'} active jobs)
          </span>
          <ExpandMoreRoundedIcon sx={{ fontSize: 18, color: '#64748B' }} />
        </div>
      </div>

      {/* Search & Actions */}
      <div className="recruiter-header-right">
        {/* Search input with shortcut */}
        <div className="recruiter-search-box">
          <SearchRoundedIcon
            sx={{
              fontSize: 18,
              color: '#94A3B8',
              position: 'absolute',
              left: '12px',
            }}
          />
          <input
            type="text"
            placeholder="Search..."
            className="recruiter-search-input"
          />
          <span className="recruiter-search-shortcut">
            ⌘S
          </span>
        </div>

        {/* Notifications */}
        <button className="recruiter-icon-btn">
          <NotificationsNoneRoundedIcon sx={{ fontSize: 20 }} />
        </button>

        <button className="recruiter-icon-btn">
          <MailOutlineRoundedIcon sx={{ fontSize: 20 }} />
        </button>

        {/* User Badge */}
        <div className="recruiter-user-profile">
          <div className="recruiter-user-avatar">
            {user?.initials || 'R'}
          </div>
          <span className="recruiter-user-name">
            {user?.name || 'Recruiter'}
          </span>
          <ExpandMoreRoundedIcon sx={{ fontSize: 18, color: '#64748B' }} />
        </div>
      </div>
    </div>
  );
};

export default RecruiterHeader;
