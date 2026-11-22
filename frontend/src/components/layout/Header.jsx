import { useNavigate, useLocation } from 'react-router-dom';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Header.css';

export const Header = ({ isMobileOpen, onToggleMobile }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isHireAI =
    location.pathname === '/dashboard' ||
    location.pathname === '/upload' ||
    location.pathname === '/my-resumes' ||
    location.pathname.startsWith('/resume/') ||
    location.pathname === '/profile';

  const isJobs = location.pathname === '/jobs';
  const isRecruiter = location.pathname === '/recruiter';

  return (
    <header className="header-container">
      {/* Left: Mobile hamburger menu toggle */}
      <div className="header-left">
        {!isMobileOpen && (
          <button
            onClick={onToggleMobile}
            className="header-menu-toggle"
            aria-label="Open navigation menu"
            aria-expanded={false}
          >
            <MenuRoundedIcon sx={{ fontSize: 20 }} />
          </button>
        )}
      </div>

      {/* Center: Quick Portal Switcher Pills */}
      <div className="header-portal-switcher">
        {user?.role !== 'recruiter' && !isRecruiter && (
          <button
            onClick={() => navigate('/dashboard')}
            className={`header-portal-pill ${isHireAI ? 'active' : ''}`}
          >
            <AutoAwesomeRoundedIcon sx={{ fontSize: 15 }} />
            <span>HireAI</span>
          </button>
        )}

        <button
          onClick={() => navigate('/jobs')}
          className={`header-portal-pill ${isJobs ? 'active' : ''}`}
        >
          <WorkOutlineRoundedIcon sx={{ fontSize: 15 }} />
          <span>RecruitAI</span>
        </button>

        {user?.role === 'recruiter' && (
          <button
            onClick={() => navigate('/recruiter')}
            className={`header-portal-pill ${isRecruiter ? 'active' : ''}`}
          >
            <BusinessCenterOutlinedIcon sx={{ fontSize: 15 }} />
            <span>Talently</span>
          </button>
        )}
      </div>

      {/* Right: User Badge */}
      <div onClick={() => navigate('/profile')} className="header-user-badge">
        <div className="header-user-avatar">
          {user.initials || 'RS'}
        </div>

        <div className="header-user-info">
          <span className="header-user-name">
            {user.name || 'Rahul Sharma'}
          </span>
          <span className="header-user-role">
            {user.role || 'Candidate'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
