import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import FeedbackAlert from '../common/FeedbackAlert';
import { useAuth } from '../../context/AuthContext';
import '../../styles/MainLayout.css';

export const MainLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { feedbackMessage, setFeedbackMessage } = useAuth();

  return (
    <div className="main-layout-root">
      <Sidebar
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      <div className="main-layout-content">
        <Header
          isMobileOpen={isMobileOpen}
          onToggleMobile={() => setIsMobileOpen((prev) => !prev)}
        />
        
        <main className="main-layout-body">
          {feedbackMessage && (
            <FeedbackAlert severity="success" onClose={() => setFeedbackMessage('')}>
              {feedbackMessage}
            </FeedbackAlert>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
