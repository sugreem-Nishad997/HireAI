import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import FeedbackAlert from '../components/common/FeedbackAlert';
import LoadingIndicator from '../components/common/LoadingIndicator';
import ResumeHeaderCard from '../components/resumes/ResumeHeaderCard';
import CustomTabs from '../components/common/CustomTabs';
import ParsedInfoSection from '../components/resumes/ParsedInfoSection';
import OriginalFileViewer from '../components/resumes/OriginalFileViewer';
import ProcessingLogViewer from '../components/resumes/ProcessingLogViewer';
import { useResumes } from '../context/ResumeContext';

export const ResumeDetailPage = () => {
  const { id } = useParams();
  const { getResumeById, loading, error } = useResumes();
  const [activeTab, setActiveTab] = useState('parsed');

  const resume = getResumeById(id);

  if (loading) {
    return <LoadingIndicator label="Loading your resume" />;
  }

  if (error) {
    return <FeedbackAlert severity="error">{error}</FeedbackAlert>;
  }

  if (!resume) {
    return (
      <div>
        <FeedbackAlert severity="warning">Resume not found or you do not have access to it.</FeedbackAlert>
        <Link to="/my-resumes">Back to My Resumes</Link>
      </div>
    );
  }

  const tabs = [
    { id: 'parsed', label: 'Parsed Information' },
    { id: 'original', label: 'Original File' },
    { id: 'logs', label: 'AI Processing Log' },
  ];

  return (
    <div className="animate-fade-in">
      <ResumeHeaderCard resume={resume} />

      <CustomTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId)}
      />

      {activeTab === 'parsed' && <ParsedInfoSection resume={resume} />}
      {activeTab === 'original' && <OriginalFileViewer resume={resume} />}
      {activeTab === 'logs' && <ProcessingLogViewer resume={resume} />}
    </div>
  );
};

export default ResumeDetailPage;
