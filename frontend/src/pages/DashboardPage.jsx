import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import StatCard from '../components/common/StatCard';
import WelcomeHeader from '../components/dashboard/WelcomeHeader';
import RecentResumesTable from '../components/dashboard/RecentResumesTable';
import FeedbackAlert from '../components/common/FeedbackAlert';
import LoadingIndicator from '../components/common/LoadingIndicator';
import { applicationApi } from '../api/client';
import { useResumes } from '../context/ResumeContext';
import '../styles/DashboardPage.css';

const getErrorMessage = (error) =>
  error.response?.data?.message || error.message || 'Unable to load your applications.';

const formatDate = (date) => {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return 'Date unavailable';

  return parsedDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getStatusLabel = (status) => ({
  pending: 'Applied',
  reviewing: 'In review',
  interview: 'Interview',
  shortlisted: 'Shortlisted',
  accepted: 'Accepted',
  rejected: 'Rejected',
}[status] || 'Applied');

export const DashboardPage = () => {
  const { resumes } = useResumes();
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [applicationsError, setApplicationsError] = useState('');

  useEffect(() => {
    let active = true;

    applicationApi.getMine()
      .then(({ data }) => {
        if (!Array.isArray(data.data)) {
          throw new Error('The server returned an invalid application list.');
        }
        if (active) setApplications(data.data);
      })
      .catch((error) => {
        if (active) setApplicationsError(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setApplicationsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const metrics = [
    {
      title: 'Total Resumes',
      value: resumes.length,
      icon: DescriptionOutlinedIcon,
      iconBg: '#EFF6FF',
      iconColor: '#2563EB',
    },
    {
      title: 'Applications',
      value: applications.length,
      icon: SendRoundedIcon,
      iconBg: '#EFF6FF',
      iconColor: '#2563EB',
    },
    {
      title: 'Shortlisted',
      value: applications.filter((application) => application.status === 'shortlisted').length,
      icon: CheckCircleOutlineRoundedIcon,
      iconBg: '#DCFCE7',
      iconColor: '#16A34A',
    },
    {
      title: 'Interviews',
      value: applications.filter((application) => application.status === 'interview').length,
      icon: EventAvailableOutlinedIcon,
      iconBg: '#FEF3C7',
      iconColor: '#D97706',
    },
  ];

  return (
    <div className="candidate-dashboard animate-fade-in">
      <WelcomeHeader />

      <section className="candidate-dashboard-actions" aria-label="Quick actions">
        <Link to="/upload" className="candidate-dashboard-action primary">
          <CloudUploadOutlinedIcon sx={{ fontSize: 24 }} />
          <span className="candidate-dashboard-action-title">Upload Resume</span>
          <span className="candidate-dashboard-action-description">Add a new resume</span>
        </Link>
        <Link to="/jobs" className="candidate-dashboard-action">
          <WorkOutlineRoundedIcon sx={{ fontSize: 24 }} />
          <span className="candidate-dashboard-action-title">Explore Jobs</span>
          <span className="candidate-dashboard-action-description">Find relevant opportunities</span>
        </Link>
      </section>

      <section className="candidate-dashboard-stats" aria-label="Job search statistics">
        {metrics.map((metric) => <StatCard key={metric.title} {...metric} />)}
      </section>

      <section className="candidate-dashboard-applications">
        <header className="candidate-dashboard-section-header">
          <div>
            <h2>Recent Applications</h2>
            <p>Your latest job applications and their progress.</p>
          </div>
          <Link to="/my-applications">View all</Link>
        </header>

        {applicationsLoading ? (
          <LoadingIndicator label="Loading applications" />
        ) : applicationsError ? (
          <FeedbackAlert severity="error">{applicationsError}</FeedbackAlert>
        ) : applications.length === 0 ? (
          <div className="candidate-dashboard-empty">
            <span>No applications yet</span>
            <Link to="/jobs">Get started</Link>
          </div>
        ) : (
          <div className="candidate-dashboard-application-list">
            {applications.slice(0, 3).map((application) => (
              <article className="candidate-dashboard-application" key={application._id}>
                <div>
                  <h3>{application.job?.title || 'Job listing unavailable'}</h3>
                  <p>Applied {formatDate(application.createdAt)}</p>
                </div>
                <span className={`candidate-dashboard-status ${application.status || 'pending'}`}>
                  {getStatusLabel(application.status)}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>

      <RecentResumesTable />
    </div>
  );
};

export default DashboardPage;
