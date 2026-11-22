import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import FeedbackAlert from '../components/common/FeedbackAlert';
import LoadingIndicator from '../components/common/LoadingIndicator';
import { jobApi } from '../api/client';
import '../styles/RecruiterJobsPage.css';

const getErrorMessage = (error) =>
  error.response?.data?.message || error.message || 'Unable to load jobs.';

export const RecruiterJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    jobApi.getAll()
      .then(({ data }) => {
        if (!Array.isArray(data.data)) {
          throw new Error('The server returned an invalid jobs list.');
        }
        if (active) setJobs(data.data);
      })
      .catch((fetchError) => {
        if (active) setError(getErrorMessage(fetchError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="recruiter-jobs-page animate-fade-in">
      <header className="recruiter-jobs-header">
        <div>
          <h1>Jobs</h1>
          <p>Manage your job listings and find the right candidates.</p>
        </div>
        <button
          type="button"
          className="recruiter-jobs-add-button"
          onClick={() => navigate('/jobs/new')}
        >
          <AddRoundedIcon sx={{ fontSize: 20 }} />
          Add Job
        </button>
      </header>

      {loading && <LoadingIndicator label="Loading jobs" />}
      {!loading && error && <FeedbackAlert severity="error">{error}</FeedbackAlert>}
      {!loading && !error && jobs.length === 0 && (
        <div className="recruiter-jobs-empty">
          <h2>No jobs posted yet</h2>
          <p>Create a job listing to start finding candidates.</p>
          <button
            type="button"
            className="recruiter-jobs-add-button"
            onClick={() => navigate('/jobs/new')}
          >
            <AddRoundedIcon sx={{ fontSize: 20 }} />
            Add your first job
          </button>
        </div>
      )}

      {!loading && !error && jobs.length > 0 && (
        <div className="recruiter-jobs-list">
          {jobs.map((job) => (
            <article className="recruiter-job-card" key={job._id}>
              <div className="recruiter-job-card-header">
                <div>
                  <h2 className="recruiter-job-title">{job.title}</h2>
                  <span>{job.minimumExperienceYears} years minimum experience</span>
                </div>
                <span className={`recruiter-job-status ${job.isActive ? 'active' : 'inactive'}`}>
                  {job.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="recruiter-job-description">{job.description}</p>
              {job.requiredSkills?.length > 0 && (
                <div className="recruiter-job-skills">
                  {job.requiredSkills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
              )}
              {job.preferredSkills?.length > 0 && (
                <p className="recruiter-job-preferred">
                  Preferred: {job.preferredSkills.join(', ')}
                </p>
              )}
              <div className="recruiter-job-card-actions">
                <button
                  type="button"
                  className="recruiter-job-preview-button"
                  onClick={() => navigate(`/jobs/${job._id}`)}
                >
                  Preview
                </button>
                <button
                  type="button"
                  className="recruiter-job-applications-button"
                  onClick={() => navigate(`/jobs/${job._id}/applicants`)}
                >
                  View applicants
                  <span className="recruiter-job-applicant-count">
                    {job.applicantCount ?? 0}
                  </span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecruiterJobsPage;
