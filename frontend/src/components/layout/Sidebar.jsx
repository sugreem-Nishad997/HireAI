import { NavLink, useNavigate } from 'react-router-dom';
import SpaceDashboardRoundedIcon from '@mui/icons-material/SpaceDashboardRounded';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Sidebar.css';

export const Sidebar = ({ isMobileOpen, onCloseMobile }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: SpaceDashboardRoundedIcon,
    },
    ...(user?.role === 'recruiter'
      ? [{
        label: 'Jobs',
        path: '/jobs',
        icon: WorkOutlineRoundedIcon,
      }]
      : [
        {
          label: 'Upload Resume',
          path: '/upload',
          icon: CloudUploadOutlinedIcon,
        },
        {
          label: 'My Resumes',
          path: '/my-resumes',
          icon: ArticleOutlinedIcon,
        },
        {
          label: 'My Applications',
          path: '/my-applications',
          icon: AssignmentOutlinedIcon,
        },
      ]),
    {
      label: 'Profile',
      path: '/profile',
      icon: PersonOutlineRoundedIcon,
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: SettingsOutlinedIcon,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div className="sidebar-mobile-backdrop" onClick={onCloseMobile} />
      )}

      <aside className={`sidebar-container ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand / Logo */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <img src="/hireai-recruitment-icon.png" alt="" />
          </div>
          <span className="sidebar-brand-text">HireAI</span>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Main Menu</div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `sidebar-nav-item ${isActive ? 'active' : ''}`
                }
              >
                <Icon sx={{ fontSize: 20 }} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          <div className="sidebar-divider" />

          <div className="sidebar-section-title">Other Views</div>

          {user?.role !== 'recruiter' && (
            <NavLink
              to="/jobs"
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `sidebar-sub-item ${isActive ? 'active' : ''}`
              }
            >
              <WorkOutlineRoundedIcon sx={{ fontSize: 19 }} />
              <span>Find Jobs (RecruitAI)</span>
            </NavLink>
          )}

          {user?.role === 'recruiter' && (
            <NavLink
              to="/recruiter"
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `sidebar-sub-item ${isActive ? 'active' : ''}`
              }
            >
              <BusinessCenterOutlinedIcon sx={{ fontSize: 19 }} />
              <span>Recruiter (Talently)</span>
            </NavLink>
          )}
        </nav>

        {/* Bottom Logout Button */}
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-logout-btn">
            <LogoutRoundedIcon sx={{ fontSize: 20 }} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
