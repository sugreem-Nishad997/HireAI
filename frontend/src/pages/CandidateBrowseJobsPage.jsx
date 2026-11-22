import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import LoadingIndicator from '../components/common/LoadingIndicator';
import RecommendedJobList from '../components/jobs/RecommendedJobList';
import { applicationApi, jobApi } from '../api/client';
import '../styles/CandidateJobsPage.css';

const getErrorMessage = (error) =>
  error.response?.data?.message || error.message || 'Unable to load jobs.';

export const CandidateBrowseJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [savingJobId, setSavingJobId] = useState(null);
  const [actionErrors, setActionErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    Promise.all([
      jobApi.getAll(),
      applicationApi.getMine(),
      jobApi.getSaved(),
    ])
      .then(([jobsResponse, applicationsResponse, savedResponse]) => {
        const jobRecords = jobsResponse.data.data;
        const applicationRecords = applicationsResponse.data.data;
        const savedRecords = savedResponse.data.data;
        if (
          !Array.isArray(jobRecords)
          || !Array.isArray(applicationRecords)
          || !Array.isArray(savedRecords)
        ) {
          throw new Error('The server returned invalid jobs or application data.');
        }

        if (active) {
          setJobs(jobRecords);
          setApplications(applicationRecords);
          setSavedJobs(savedRecords);
        }
      })
      .catch((error) => {
        if (active) setLoadError(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const appliedJobIds = useMemo(
    () => new Set(applications.map((application) => String(application.job?._id || application.job))),
    [applications],
  );
  const savedJobIds = useMemo(
    () => new Set(savedJobs.map((savedJob) => String(savedJob.job?._id || savedJob.job))),
    [savedJobs],
  );

  const setActionError = (jobId, message) => {
    setActionErrors((previous) => ({...previous, [jobId]: message}));
  };

  const handleApply = (job) => navigate(`/jobs/${encodeURIComponent(job._id)}/apply`);

  const handleToggleSaved = async (job) => {
    const jobId = String(job._id);
    setSavingJobId(jobId);
    setActionError(jobId, '');

    try {
      if (savedJobIds.has(jobId)) {
        await jobApi.unsave(jobId);
        setSavedJobs((previous) => previous.filter(
          (savedJob) => String(savedJob.job?._id || savedJob.job) !== jobId,
        ));
      } else {
        const { data } = await jobApi.save(jobId);
        setSavedJobs((previous) => [
          {...data.data, job},
          ...previous.filter(
            (savedJob) => String(savedJob.job?._id || savedJob.job) !== jobId,
          ),
        ]);
      }
    } catch (error) {
      setActionError(jobId, getErrorMessage(error));
    } finally {
      setSavingJobId(null);
    }
  };

  return (
    <div className="candidate-browse-jobs-page animate-fade-in">
      <header className="candidate-browse-jobs-header">
        <button
          type="button"
          className="candidate-browse-jobs-back"
          onClick={() => navigate('/jobs')}
        >
          <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
          Back to dashboard
        </button>
        <h1>All Jobs</h1>
        <p>Browse all active jobs posted by recruiters.</p>
      </header>

      {loading ? (
        <LoadingIndicator label="Loading jobs" />
      ) : (
        <RecommendedJobList
          jobs={jobs}
          error={loadError}
          appliedJobIds={appliedJobIds}
          savedJobIds={savedJobIds}
          savingJobId={savingJobId}
          actionErrors={actionErrors}
          onApply={handleApply}
          onToggleSaved={handleToggleSaved}
          title="All Jobs"
          subtitle={`${jobs.length} active jobs listed by recruiters`}
          emptyMessage="There are no active jobs available right now."
        />
      )}
    </div>
  );
};

export default CandidateBrowseJobsPage;
