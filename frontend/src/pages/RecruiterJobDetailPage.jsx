import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import FeedbackAlert from '../components/common/FeedbackAlert';
import LoadingIndicator from '../components/common/LoadingIndicator';
import { jobApi } from '../api/client';
import '../styles/RecruiterJobsPage.css';

const getErrorMessage = (error) =>
  error.response?.data?.message || error.message || 'Unable to load job.';

export const RecruiterJobDetailPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [requestState, setRequestState] = useState({
    jobId: null,
    job: null,
    loading: true,
    error: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    let active = true;
    jobApi.getById(jobId)
      .then(({ data }) => {
        if (!data.data || typeof data.data !== 'object') {
          throw new Error('The server returned an invalid job.');
        }
        if (active) {
          setRequestState({
            jobId,
            job: data.data,
            loading: false,
            error: '',
          });
          setForm({
            title: data.data.title || '',
            description: data.data.description || '',
            requiredSkills: (data.data.requiredSkills || []).join(', '),
            preferredSkills: (data.data.preferredSkills || []).join(', '),
            minimumExperienceYears: String(data.data.minimumExperienceYears ?? 0),
            isActive: Boolean(data.data.isActive),
          });
        }
      })
      .catch((fetchError) => {
        if (active) {
          setRequestState({
            jobId,
            job: null,
            loading: false,
            error: getErrorMessage(fetchError),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [jobId]);

  const isCurrentRequest = requestState.jobId === jobId;
  const loading = !isCurrentRequest || requestState.loading;
  const job = isCurrentRequest ? requestState.job : null;
  const error = isCurrentRequest ? requestState.error : '';

  const updateForm = (field, value) => {
    setForm((previous) => ({...previous, [field]: value}));
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setRequestState((previous) => ({...previous, error: ''}));

    try {
      const { data } = await jobApi.update(jobId, {
        title: form.title.trim(),
        description: form.description.trim(),
        requiredSkills: form.requiredSkills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
        preferredSkills: form.preferredSkills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
        minimumExperienceYears: Number(form.minimumExperienceYears),
        isActive: form.isActive,
      });
      setRequestState((previous) => ({...previous, job: data.data}));
      setIsEditing(false);
    } catch (updateError) {
      setRequestState((previous) => ({
        ...previous,
        error: getErrorMessage(updateError),
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this job listing? It will no longer be visible to candidates.')) {
      return;
    }

    setIsDeleting(true);
    setRequestState((previous) => ({...previous, error: ''}));
    try {
      await jobApi.deactivate(jobId);
      navigate('/jobs', {replace: true});
    } catch (deleteError) {
      setRequestState((previous) => ({
        ...previous,
        error: getErrorMessage(deleteError),
      }));
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <LoadingIndicator label="Loading job details" />;
  }

  if (!job) {
    return (
      <div className="recruiter-jobs-page">
        <FeedbackAlert severity="error">{error || 'Job not found.'}</FeedbackAlert>
        <button
          type="button"
          className="recruiter-jobs-back-button"
          onClick={() => navigate('/jobs')}
        >
          <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
          Back to Jobs
        </button>
      </div>
    );
  }

  return (
    <div className="recruiter-jobs-page animate-fade-in">
      <button
        type="button"
        className="recruiter-jobs-back-button"
        onClick={() => navigate('/jobs')}
      >
        <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
        Back to Jobs
      </button>

      <header className="recruiter-jobs-header">
        <div>
          <h1>{job.title}</h1>
          <p>
            Posted {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'date unavailable'}
          </p>
        </div>
        <div className="recruiter-job-detail-actions">
          {!isEditing && (
            <button
              type="button"
              className="recruiter-jobs-add-button"
              onClick={() => setIsEditing(true)}
            >
              <EditOutlinedIcon sx={{ fontSize: 18 }} />
              Update Job
            </button>
          )}
          <button
            type="button"
            className="recruiter-job-delete-button"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
            {isDeleting ? 'Deleting...' : 'Delete Job'}
          </button>
        </div>
      </header>

      {error && <FeedbackAlert severity="error">{error}</FeedbackAlert>}

      {isEditing ? (
        <form className="recruiter-job-form" onSubmit={handleUpdate}>
          <label>
            Job title
            <input
              type="text"
              required
              maxLength={160}
              value={form.title}
              onChange={(event) => updateForm('title', event.target.value)}
            />
          </label>

          <label>
            Job description
            <textarea
              required
              rows={7}
              value={form.description}
              onChange={(event) => updateForm('description', event.target.value)}
            />
          </label>

          <label>
            Required skills
            <input
              type="text"
              value={form.requiredSkills}
              onChange={(event) => updateForm('requiredSkills', event.target.value)}
            />
            <span>Separate skills with commas.</span>
          </label>

          <label>
            Preferred skills
            <input
              type="text"
              value={form.preferredSkills}
              onChange={(event) => updateForm('preferredSkills', event.target.value)}
            />
            <span>Separate skills with commas.</span>
          </label>

          <label>
            Minimum experience (years)
            <input
              type="number"
              min="0"
              step="0.5"
              required
              value={form.minimumExperienceYears}
              onChange={(event) => updateForm('minimumExperienceYears', event.target.value)}
            />
          </label>

          <label className="recruiter-job-active-toggle">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => updateForm('isActive', event.target.checked)}
            />
            Listing is active
          </label>

          <div className="recruiter-job-form-actions">
            <button
              type="button"
              className="recruiter-job-cancel-button"
              onClick={() => {
                setForm({
                  title: job.title || '',
                  description: job.description || '',
                  requiredSkills: (job.requiredSkills || []).join(', '),
                  preferredSkills: (job.preferredSkills || []).join(', '),
                  minimumExperienceYears: String(job.minimumExperienceYears ?? 0),
                  isActive: Boolean(job.isActive),
                });
                setIsEditing(false);
                setRequestState((previous) => ({...previous, error: ''}));
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="recruiter-jobs-add-button"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        <article className="recruiter-job-detail-card">
          <div className="recruiter-job-card-header">
            <div>
              <h2>Job details</h2>
              <span>{job.minimumExperienceYears ?? 0} years minimum experience</span>
            </div>
            <span className={`recruiter-job-status ${job.isActive ? 'active' : 'inactive'}`}>
              {job.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <h3>Description</h3>
          <p className="recruiter-job-description">{job.description}</p>

          <h3>Required skills</h3>
          {job.requiredSkills?.length ? (
            <div className="recruiter-job-skills">
              {job.requiredSkills.map((skill) => <span key={skill}>{skill}</span>)}
            </div>
          ) : <p className="recruiter-job-detail-muted">No required skills listed.</p>}

          <h3>Preferred skills</h3>
          {job.preferredSkills?.length ? (
            <div className="recruiter-job-skills">
              {job.preferredSkills.map((skill) => <span key={skill}>{skill}</span>)}
            </div>
          ) : <p className="recruiter-job-detail-muted">No preferred skills listed.</p>}
        </article>
      )}
    </div>
  );
};

export default RecruiterJobDetailPage;
