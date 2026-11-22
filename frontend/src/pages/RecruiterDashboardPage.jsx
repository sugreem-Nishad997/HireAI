import { useEffect, useState } from 'react';
import FeedbackAlert from '../components/common/FeedbackAlert';
import RecruiterHeader from '../components/recruiter/RecruiterHeader';
import RecruiterStats from '../components/recruiter/RecruiterStats';
import CandidatesTable from '../components/recruiter/CandidatesTable';
import { recruiterApi } from '../api/client';
import '../styles/RecruiterDashboardPage.css';

export const RecruiterDashboardPage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    recruiterApi.getDashboard()
      .then(({ data }) => {
        if (!data.data || !Array.isArray(data.data.candidates)) {
          throw new Error('The server returned invalid recruiter dashboard data.');
        }
        if (active) setDashboard(data.data);
      })
      .catch((fetchError) => {
        if (active) {
          setError(
            fetchError.response?.data?.message ||
            fetchError.message ||
            'Unable to load recruiter dashboard data.'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="animate-fade-in">
      <RecruiterHeader activeJobs={dashboard?.metrics?.activeJobs} loading={loading} />
      {error && <FeedbackAlert severity="error">{error}</FeedbackAlert>}
      <RecruiterStats metrics={dashboard?.metrics} loading={loading} />

      <div className="recruiter-grid-row-2">
        <CandidatesTable
          candidates={dashboard?.candidates}
          loading={loading}
          error={Boolean(error)}
        />
      </div>
    </div>
  );
};

export default RecruiterDashboardPage;
