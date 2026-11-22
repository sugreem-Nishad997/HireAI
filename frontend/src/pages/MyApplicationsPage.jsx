import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Drawer, IconButton } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import FeedbackAlert from '../components/common/FeedbackAlert';
import LoadingIndicator from '../components/common/LoadingIndicator';
import { applicationApi } from '../api/client';
import '../styles/MyApplicationsPage.css';

const getErrorMessage = (error) =>
  error.response?.data?.message || error.message || 'Unable to load your applications.';

const formatAppliedDate = (date) => {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return 'Date unavailable';

  return parsedDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTimelineDate = (date) => {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return 'Date unavailable';

  return parsedDate.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getMatchTone = (score) => {
  if (!Number.isFinite(score)) return 'pending';
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
};

const getStatusLabel = (status) => ({
  pending: 'Applied',
  reviewing: 'In review',
  interview: 'Interview',
  shortlisted: 'Shortlisted',
  accepted: 'Accepted',
  rejected: 'Rejected',
}[status] || 'Applied');

export const MyApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    applicationApi.getMine()
      .then(({ data }) => {
        if (!Array.isArray(data.data)) {
          throw new Error('The server returned an invalid application list.');
        }
        if (active) setApplications(data.data);
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
    <main className="my-applications-page animate-fade-in">
      <header className="my-applications-header">
        <div>
          <span className="my-applications-eyebrow">Your job search</span>
          <h1>My Applications</h1>
          <p>Track the jobs you have applied to and your AI resume match.</p>
        </div>
        <span className="my-applications-count">
          {applications.length} {applications.length === 1 ? 'application' : 'applications'}
        </span>
      </header>

      {loading ? (
        <LoadingIndicator label="Loading applications" className="my-applications-state" />
      ) : error ? (
        <FeedbackAlert severity="error">{error}</FeedbackAlert>
      ) : applications.length === 0 ? (
        <section className="my-applications-empty">
          <div className="my-applications-empty-icon">
            <WorkOutlineRoundedIcon sx={{ fontSize: 26 }} />
          </div>
          <h2>No applications yet</h2>
          <p>When you apply for a job, it will appear here with its status and match score.</p>
          <Link to="/jobs">Find jobs</Link>
        </section>
      ) : (
        <section className="my-applications-list" aria-label="Your job applications">
          {applications.map((application) => {
            const score = application.matchResult?.matchScore;
            const job = application.job;
            const companyName = job?.companyName || job?.company;
            const recruiterName = job?.recruiter?.name;
            const displayCompany = companyName || (recruiterName && `Posted by ${recruiterName}`);

            return (
              <button
                type="button"
                className="my-application-card"
                key={application._id}
                onClick={() => setSelectedApplication(application)}
                aria-label={`View application details for ${job?.title || 'job listing unavailable'}`}
              >
                <div className="my-application-main">
                  <div className="my-application-job">
                    <h2>{job?.title || 'Job listing unavailable'}</h2>
                    {displayCompany && (
                      <p className="my-application-company">
                        {displayCompany}
                      </p>
                    )}
                    <div className="my-application-meta">
                      <span>Applied {formatAppliedDate(application.createdAt)}</span>
                      <span className="my-application-meta-separator" aria-hidden="true">·</span>
                      <span>
                        Resume: {application.resume?.file?.originalName || 'Resume unavailable'}
                      </span>
                    </div>
                  </div>

                  <div className="my-application-match">
                    <span className="my-application-match-label">AI resume match</span>
                    <span className={`my-application-score ${getMatchTone(score)}`}>
                      {Number.isFinite(score) ? `${score}%` : 'Pending'}
                    </span>
                  </div>
                </div>

                <div className={`my-application-status ${application.status || 'pending'}`}>
                  {getStatusLabel(application.status)}
                </div>
              </button>
            );
          })}
        </section>
      )}

      <Drawer
        anchor="right"
        open={Boolean(selectedApplication)}
        onClose={() => setSelectedApplication(null)}
        PaperProps={{ className: 'application-detail-drawer' }}
      >
        {selectedApplication && (() => {
          const { job, resume, matchResult } = selectedApplication;
          const companyName = job?.companyName
            || job?.company
            || job?.recruiter?.name
            || 'Company unavailable';
          const history = [...(selectedApplication.statusHistory || [])]
            .sort((left, right) => new Date(left.changedAt) - new Date(right.changedAt));
          const timeline = history.length > 0
            ? history
            : [{
              _id: 'application-submitted',
              newStatus: selectedApplication.status || 'pending',
              note: 'Application submitted',
              changedAt: selectedApplication.createdAt,
            }];

          return (
            <div
              className="application-detail-content"
              role="dialog"
              aria-modal="true"
              aria-labelledby="application-detail-dialog-title"
            >
              <header className="application-detail-header">
                <div className="application-detail-heading-row">
                  <span className="application-detail-eyebrow">Application details</span>
                  <IconButton
                    aria-label="Close application details"
                    onClick={() => setSelectedApplication(null)}
                    size="small"
                  >
                    <CloseRoundedIcon />
                  </IconButton>
                </div>
                <div className="application-detail-title-row">
                  <div>
                    <h2 id="application-detail-dialog-title">
                      {job?.title || 'Job listing unavailable'}
                    </h2>
                    <p>{companyName}</p>
                    <span>Applied {formatAppliedDate(selectedApplication.createdAt)}</span>
                  </div>
                  <span className={`my-application-status ${selectedApplication.status || 'pending'}`}>
                    {getStatusLabel(selectedApplication.status)}
                  </span>
                </div>
              </header>

              <section className="application-detail-section" aria-labelledby="application-match-title">
                <div className="application-detail-section-heading">
                  <h3 id="application-match-title">AI Match Analysis</h3>
                  <span className={`my-application-score ${getMatchTone(matchResult?.matchScore)}`}>
                    {Number.isFinite(matchResult?.matchScore)
                      ? `${matchResult.matchScore}% match`
                      : selectedApplication.matchingStatus === 'failed'
                        ? 'Unavailable'
                        : 'Pending'}
                  </span>
                </div>
                {matchResult?.summary && (
                  <p className="application-detail-summary">{matchResult.summary}</p>
                )}
                <div className="application-detail-skills-grid">
                  <div>
                    <h4>Matching skills</h4>
                    {matchResult?.matchedSkills?.length ? (
                      <ul className="application-detail-skill-list matched">
                        {matchResult.matchedSkills.map((skill) => <li key={skill}>{skill}</li>)}
                      </ul>
                    ) : (
                      <p className="application-detail-muted">No matching skills available yet.</p>
                    )}
                  </div>
                  <div>
                    <h4>Missed skills</h4>
                    {matchResult?.missingRequiredSkills?.length ? (
                      <ul className="application-detail-skill-list missing">
                        {matchResult.missingRequiredSkills.map((skill) => <li key={skill}>{skill}</li>)}
                      </ul>
                    ) : (
                      <p className="application-detail-muted">No missed skills reported.</p>
                    )}
                  </div>
                </div>
              </section>

              <section className="application-detail-section" aria-labelledby="application-timeline-title">
                <h3 id="application-timeline-title">Application timeline</h3>
                <ol className="application-detail-timeline">
                  {timeline.map((event) => (
                    <li key={event._id}>
                      <span className="application-timeline-marker" aria-hidden="true" />
                      <div>
                        <strong>{getStatusLabel(event.newStatus)}</strong>
                        <time dateTime={event.changedAt}>
                          {formatTimelineDate(event.changedAt)}
                        </time>
                        {event.changedBy?.name && (
                          <span className="application-timeline-by">
                            Updated by {event.changedBy.name}
                          </span>
                        )}
                        {event.note && <p>{event.note}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="application-detail-section" aria-labelledby="application-resume-title">
                <h3 id="application-resume-title">Resume submitted</h3>
                <div className="application-detail-resume">
                  <WorkOutlineRoundedIcon sx={{ fontSize: 20 }} />
                  <div>
                    <strong>{resume?.file?.originalName || 'Resume unavailable'}</strong>
                    <span>
                      {resume?.createdAt
                        ? `Submitted ${formatAppliedDate(resume.createdAt)}`
                        : 'Submitted with this application'}
                    </span>
                    {resume?._id && (
                      <Link to={`/resume/${resume._id}`} className="application-detail-resume-link">
                        Open resume
                      </Link>
                    )}
                  </div>
                </div>
              </section>
            </div>
          );
        })()}
      </Drawer>
    </main>
  );
};

export default MyApplicationsPage;
