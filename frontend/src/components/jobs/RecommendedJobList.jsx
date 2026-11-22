import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import BookmarkBorderRoundedIcon from '@mui/icons-material/BookmarkBorderRounded';
import BookmarkRoundedIcon from '@mui/icons-material/BookmarkRounded';
import FeedbackAlert from '../common/FeedbackAlert';
import '../../styles/RecommendedJobList.css';

const formatPostedDate = (date) => {
  if (!date) return '';
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return '';
  return `Posted ${parsedDate.toLocaleDateString()}`;
};

export const RecommendedJobList = ({
  jobs = [],
  appliedJobIds = new Set(),
  savedJobIds = new Set(),
  savingJobId,
  actionErrors = {},
  onApply,
  onToggleSaved,
  error,
  title = 'Recommended for You',
  subtitle = 'Active jobs listed by recruiters',
  emptyMessage = 'There are no active jobs available right now.',
}) => (
  <section className="rec-jobs-container" id="recommended-jobs">
    <div className="rec-jobs-header">
      <div>
        <h3 className="rec-jobs-title">{title}</h3>
        <span className="rec-jobs-subtitle">{subtitle}</span>
      </div>
    </div>

    {error ? (
      <FeedbackAlert severity="error">{error}</FeedbackAlert>
    ) : jobs.length === 0 ? (
      <p className="rec-jobs-empty">{emptyMessage}</p>
    ) : (
      <div className="rec-jobs-list">
        {jobs.map((job) => {
          const jobId = String(job._id);
          const isSaved = savedJobIds.has(jobId);
          const hasApplied = appliedJobIds.has(jobId);
          const isSaving = savingJobId === jobId;

          return (
            <article key={jobId} className="rec-job-card">
              <div className="rec-job-header">
                <div>
                  <h4 className="rec-job-title">{job.title}</h4>
                  <span className="rec-job-company">Posted by recruiter</span>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleSaved(job)}
                  className="rec-job-bookmark-btn"
                  style={{ color: isSaved ? '#2563EB' : '#94A3B8' }}
                  aria-label={isSaved ? `Remove ${job.title} from saved jobs` : `Save ${job.title}`}
                  aria-pressed={isSaved}
                  disabled={isSaving}
                >
                  {isSaved ? (
                    <BookmarkRoundedIcon sx={{ fontSize: 20 }} />
                  ) : (
                    <BookmarkBorderRoundedIcon sx={{ fontSize: 20 }} />
                  )}
                </button>
              </div>

              <p className="rec-job-description">{job.description}</p>

              <div className="rec-job-meta-row">
                <div className="rec-job-meta-item">
                  <AccessTimeRoundedIcon sx={{ fontSize: 16 }} />
                  <span>{job.minimumExperienceYears || 0}+ years experience</span>
                </div>
              </div>

              {job.requiredSkills?.length > 0 && (
                <div className="rec-job-skills">
                  {job.requiredSkills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
              )}

              {actionErrors[jobId] && (
                <FeedbackAlert severity="error">{actionErrors[jobId]}</FeedbackAlert>
              )}

              <div className="rec-job-footer">
                <span className="rec-job-posted">{formatPostedDate(job.createdAt)}</span>
                <button
                  type="button"
                  onClick={() => onApply(job)}
                  className={`rec-job-apply-btn ${hasApplied ? 'applied' : ''}`}
                  disabled={hasApplied}
                >
                  {hasApplied ? 'Applied' : 'Apply Now'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    )}
  </section>
);

export default RecommendedJobList;
