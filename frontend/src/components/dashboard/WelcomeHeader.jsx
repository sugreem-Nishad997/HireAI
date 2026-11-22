import { useAuth } from '../../context/AuthContext';
import '../../styles/WelcomeHeader.css';

export const WelcomeHeader = () => {
  const { user } = useAuth();
  const firstName = user?.name ? user.name.split(' ')[0] : 'Candidate';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="welcome-header-container">
      <div className="welcome-header-title-row">
        <h1 className="welcome-header-title">{greeting}, {firstName} 👋</h1>
        <span className="welcome-header-role">Candidate</span>
      </div>
      <p className="welcome-header-subtitle">Track your resumes and job applications.</p>
    </div>
  );
};

export default WelcomeHeader;
