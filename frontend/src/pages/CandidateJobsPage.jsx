import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingIndicator from '../components/common/LoadingIndicator';
import FeedbackAlert from '../components/common/FeedbackAlert';
import JobBanner from '../components/jobs/JobBanner';
import JobMetricCards from '../components/jobs/JobMetricCards';
import RecommendedJobsSection from '../components/candidate/recommendations/RecommendedJobsSection';
import ApplicationTracker from '../components/jobs/ApplicationTracker';
import { applicationApi, jobApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import '../styles/CandidateJobsPage.css';

const getErrorMessage = (error) =>
  error.response?.data?.message || error.message || 'Unable to load jobs.';

export const CandidateJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [savingJobId, setSavingJobId] = useState(null);
  const [actionErrors, setActionErrors] = useState({});
  const { user } = useAuth();
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

  const seenApplications = applications.filter((application) => application.recruiterViewedAt).length;
  const respondedApplications = applications.filter(
    (application) => application.status !== 'pending',
  ).length;
  const responseRate = applications.length
    ? Math.round((respondedApplications / applications.length) * 100)
    : 0;

  const metrics = {
    applicationsSent: applications.length,
    interviews: applications.filter((application) => application.status === 'interview').length,
    seenByRecruiters: seenApplications,
    responseRate: `${responseRate}%`,
  };

  const setActionError = (jobId, message) => {
    setActionErrors((previous) => ({ ...previous, [jobId]: message }));
  };

  const handleApply = (job) => {
    const targetJobId = String(job.jobId || job._id || '');
    if (targetJobId) {
      navigate(`/jobs/${encodeURIComponent(targetJobId)}/apply`);
    }
  };

  const handleToggleSaved = async (job) => {
    const targetJobId = String(job.jobId || job._id || '');
    if (!targetJobId) return;

    setSavingJobId(targetJobId);
    setActionError(targetJobId, '');

    try {
      if (savedJobIds.has(targetJobId)) {
        await jobApi.unsave(targetJobId);
        setSavedJobs((previous) =>
          previous.filter(
            (savedJob) => String(savedJob.job?._id || savedJob.job) !== targetJobId,
          ),
        );
      } else {
        const { data } = await jobApi.save(targetJobId);
        setSavedJobs((previous) => [
          { ...data.data, job: { _id: targetJobId, ...job } },
          ...previous.filter(
            (savedJob) => String(savedJob.job?._id || savedJob.job) !== targetJobId,
          ),
        ]);
      }
    } catch (error) {
      setActionError(targetJobId, getErrorMessage(error));
    } finally {
      setSavingJobId(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="candidate-jobs-top-row">
        <JobBanner
          candidateName={user?.name}
          availableJobs={jobs.length}
          applicationCount={applications.length}
          onAction={() => navigate('/jobs/browse')}
        />
      </div>

      <JobMetricCards metrics={metrics} />

      {loadError && (
        <FeedbackAlert severity="error" className="candidate-jobs-error">
          {loadError}
        </FeedbackAlert>
      )}

      {loading ? (
        <LoadingIndicator
          label="Loading jobs and applications"
          className="candidate-jobs-loading"
        />
      ) : (
        <div className="candidate-jobs-main-split">
          <RecommendedJobsSection
            appliedJobIds={appliedJobIds}
            savedJobIds={savedJobIds}
            savingJobId={savingJobId}
            actionErrors={actionErrors}
            onApply={handleApply}
            onToggleSaved={handleToggleSaved}
          />
          <ApplicationTracker
            applications={applications}
            savedJobs={savedJobs}
          />
        </div>
      )}
    </div>
  );
};

export default CandidateJobsPage;
