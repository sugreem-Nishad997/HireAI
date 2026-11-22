import { useEffect, useMemo, useState } from 'react';
import FeedbackAlert from '../components/common/FeedbackAlert';
import LoadingIndicator from '../components/common/LoadingIndicator';
import CustomTabs from '../components/common/CustomTabs';
import ProfileHeaderCard from '../components/profile/ProfileHeaderCard';
import ProfileOverview from '../components/profile/ProfileOverview';
import { profileApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(user?.role === 'candidate');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role !== 'candidate') {
      return undefined;
    }

    let active = true;
    profileApi.getMine()
      .then(({ data }) => {
        if (active) setProfile(data.data);
      })
      .catch((fetchError) => {
        if (active) {
          setError(
            fetchError.response?.data?.message
            || fetchError.message
            || 'Unable to load your profile.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user?.id, user?.role]);

  const profileView = useMemo(() => profile && ({
    personalInfo: {
      fullName: profile.fullName || '',
      email: profile.email || '',
      phone: profile.phone || '',
      location: profile.location || '',
      summary: profile.summary || '',
    },
    skills: profile.skills || [],
    education: profile.education || [],
    experience: (profile.experience || []).map((item) => ({
      ...item,
      period: [item.startDate, item.endDate].filter(Boolean).join(' - '),
    })),
    projects: profile.projects || [],
  }), [profile]);

  const hasProfileDetails = Boolean(
    profileView && (
      profileView.personalInfo.summary
      || profileView.skills.length
      || profileView.education.length
      || profileView.experience.length
      || profileView.projects.length
    ),
  );
  const tabs = [
    { id: 'overview', label: 'Overview' },
    ...(profileView?.skills.length ? [{ id: 'skills', label: 'Skills' }] : []),
    ...(profileView?.education.length ? [{ id: 'education', label: 'Education' }] : []),
    ...(profileView?.experience.length ? [{ id: 'experience', label: 'Experience' }] : []),
    ...(profileView?.projects.length ? [{ id: 'projects', label: 'Projects' }] : []),
  ];
  const selectedTab = tabs.some((tab) => tab.id === activeTab) ? activeTab : 'overview';

  return (
    <div className="animate-fade-in">
      <ProfileHeaderCard profile={profileView} />

      {loading && <LoadingIndicator label="Loading your profile" />}
      {error && <FeedbackAlert severity="error">{error}</FeedbackAlert>}

      {user?.role === 'candidate' && !loading && !error && !hasProfileDetails && (
        <FeedbackAlert severity="info">
          Your profile details will appear here after you upload a resume or update your profile in Settings.
        </FeedbackAlert>
      )}

      {hasProfileDetails && (
        <>
          <CustomTabs
            tabs={tabs}
            activeTab={selectedTab}
            onTabChange={(tabId) => setActiveTab(tabId)}
          />
          <ProfileOverview resume={profileView} activeTab={selectedTab} />
        </>
      )}
    </div>
  );
};

export default ProfilePage;
