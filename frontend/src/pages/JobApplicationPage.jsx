import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import FeedbackAlert from '../components/common/FeedbackAlert';
import LoadingIndicator from '../components/common/LoadingIndicator';
import { applicationApi, jobApi } from '../api/client';
import { useResumes } from '../context/ResumeContext';
import '../styles/JobApplicationPage.css';

const getErrorMessage = (error) =>
  error.response?.data?.message || error.message || 'Unable to complete your application.';

export const JobApplicationPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { resumes, loading: resumesLoading, error: resumeError, uploadResume } = useResumes();
  const [job, setJob] = useState(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [jobError, setJobError] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let active = true;

    jobApi.getById(jobId)
      .then(({ data }) => {
        if (!data.data?._id) {
          throw new Error('The server returned invalid job details.');
        }
        if (active) setJob(data.data);
      })
      .catch((fetchError) => {
        if (active) setJobError(getErrorMessage(fetchError));
      })
      .finally(() => {
        if (active) setJobLoading(false);
      });

    return () => {
      active = false;
    };
  }, [jobId]);

  const readyResumes = resumes.filter((resume) => resume.status === 'Completed');

  const handleResumeUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const validExtension = /\.(pdf|docx)$/i.test(file.name);
    if (!validExtension || file.size > 10 * 1024 * 1024) {
      setError('Choose a PDF or DOCX resume no larger than 10 MB.');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const resumeId = await uploadResume(file);
      setSelectedResumeId(resumeId);
    } catch (uploadError) {
      setError(getErrorMessage(uploadError));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedResumeId) {
      setError('Select a completed resume before submitting your application.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await applicationApi.applyToJob(jobId, selectedResumeId);
      setSubmitted(true);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  if (jobLoading || resumesLoading) {
    return <LoadingIndicator label="Loading application details" className="job-application-loading" />;
  }

  if (jobError || !job) {
    return (
      <section className="job-application-page">
        <FeedbackAlert severity="error">{jobError || 'This job is unavailable.'}</FeedbackAlert>
        <Link className="job-application-back-link" to="/jobs">Back to jobs</Link>
      </section>
    );
  }

  if (submitted) {
    return (
      <section className="job-application-page job-application-success">
        <FeedbackAlert severity="success">
          Your application for <strong>{job.title}</strong> has been submitted.
        </FeedbackAlert>
        <button type="button" className="job-application-submit" onClick={() => navigate('/jobs')}>
          Back to jobs
        </button>
      </section>
    );
  }

  return (
    <main className="job-application-page">
      <Link className="job-application-back-link" to="/jobs">← Back to jobs</Link>

      <header className="job-application-header">
        <span className="job-application-eyebrow">Job application</span>
        <h1>Apply for &quot;{job.title}&quot;</h1>
        <p className="job-application-description">{job.description}</p>
      </header>

      <form className="job-application-form" onSubmit={handleSubmit}>
        <div className="job-application-section-heading">
          <div>
            <h2>Select a resume</h2>
            <p>Choose an existing resume or upload a new one for this application.</p>
          </div>
        </div>

        {resumeError && (
          <FeedbackAlert severity="warning">
            {resumeError} You can still upload a resume below.
          </FeedbackAlert>
        )}

        {readyResumes.length > 0 ? (
          <div className="job-application-resume-list">
            {readyResumes.map((resume) => (
              <label
                key={resume.id}
                className={`job-application-resume-option ${selectedResumeId === resume.id ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="resume"
                  value={resume.id}
                  checked={selectedResumeId === resume.id}
                  onChange={() => {
                    setSelectedResumeId(resume.id);
                    setError('');
                  }}
                />
                <span className="job-application-resume-details">
                  <strong>{resume.fileName}</strong>
                  <span>{resume.fileSize} · Uploaded {resume.uploadedOn}</span>
                </span>
                <span className="job-application-resume-status">{resume.status}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="job-application-empty-resumes">
            You don&apos;t have a completed resume yet. Upload one to continue.
          </p>
        )}

        <div className="job-application-upload">
          <input
            ref={fileInputRef}
            className="job-application-file-input"
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleResumeUpload}
          />
          <button
            type="button"
            className="job-application-upload-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || submitting}
          >
            <CloudUploadOutlinedIcon sx={{ fontSize: 20 }} />
            {uploading ? 'Uploading resume...' : 'Add a new resume'}
          </button>
          <span>PDF or DOCX, up to 10 MB</span>
        </div>

        {error && <FeedbackAlert severity="error">{error}</FeedbackAlert>}

        <div className="job-application-actions">
          <button type="button" className="job-application-cancel" onClick={() => navigate('/jobs')}>
            Cancel
          </button>
          <button
            type="submit"
            className="job-application-submit"
            disabled={!selectedResumeId || submitting || uploading}
          >
            {submitting ? 'Submitting...' : 'Submit application'}
          </button>
        </div>
      </form>
    </main>
  );
};

export default JobApplicationPage;
