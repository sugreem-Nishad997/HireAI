import { useState } from 'react';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import '../../styles/ApplicationTracker.css';

const stages = ['Applied', 'Screening', 'Interview', 'Decision'];

const getStageIndex = (status) => ({
  pending: 0,
  reviewing: 1,
  interview: 2,
  accepted: 3,
  rejected: 3,
}[status] ?? 0);

const getStatusLabel = (status) => ({
  pending: 'Applied',
  reviewing: 'Screening',
  interview: 'Interview',
  accepted: 'Accepted',
  rejected: 'Rejected',
}[status] || 'Applied');

const formatDate = (date) => {
  if (!date) return '';
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return '';
  return parsedDate.toLocaleDateString();
};

export const ApplicationTracker = ({ applications = [], savedJobs = [] }) => {
  const [showSavedJobs, setShowSavedJobs] = useState(false);
  const seenCount = applications.filter((application) => application.recruiterViewedAt).length;

  return (
    <aside className="app-tracker-sidebar">
      <section className="app-tracker-card">
        <div className="app-tracker-header">
          <h3 className="app-tracker-title">Application Tracker</h3>
          <span className="app-tracker-subtitle">
            {seenCount} of {applications.length} applications seen by recruiters
          </span>
        </div>

        {applications.length === 0 ? (
          <p className="app-tracker-empty">Your applications will appear here.</p>
        ) : (
          <div className="app-tracker-list">
            {applications.map((application) => {
              const status = application.status || 'pending';
              const activeStage = getStageIndex(status);
              const job = application.job || {};
              const statusLabel = getStatusLabel(status);
              const isNegative = status === 'rejected';

              return (
                <article key={application._id} className="app-tracker-item">
                  <div className="app-tracker-role-row">
                    <div>
                      <h4 className="app-tracker-role-title">
                        {job.title || 'Job listing unavailable'}
                      </h4>
                      <span className="app-tracker-role-company">
                        Applied {formatDate(application.createdAt)}
                      </span>
                    </div>
                    <div className="app-tracker-badge-block">
                      <span
                        className="app-tracker-step-badge"
                        style={isNegative
                          ? { backgroundColor: '#FEE2E2', color: '#B91C1C' }
                          : undefined}
                      >
                        {statusLabel}
                      </span>
                      <div className={`app-tracker-seen ${application.recruiterViewedAt ? 'seen' : ''}`}>
                        {application.recruiterViewedAt ? 'Seen by recruiter' : 'Not seen yet'}
                      </div>
                    </div>
                  </div>

                  {application.recruiterViewedAt && (
                    <p className="app-tracker-seen-date">
                      Viewed {formatDate(application.recruiterViewedAt)}
                    </p>
                  )}

                  <div className="app-tracker-stepper-wrap">
                    <div className="app-tracker-connecting-line" />
                    <div className="app-tracker-steps-row">
                      {stages.map((label, index) => {
                        const isCompleted = index < activeStage;
                        const isActive = index === activeStage;
                        const dotClass = isCompleted
                          ? 'completed'
                          : isActive
                            ? 'active'
                            : 'pending';

                        return (
                          <div key={label} className="app-tracker-step-col">
                            <div className={`app-tracker-dot ${dotClass}`}>
                              {isCompleted && <div className="app-tracker-dot-inner" />}
                            </div>
                            <span
                              className="app-tracker-step-label"
                              style={{
                                color: isActive ? '#2563EB' : isCompleted ? '#0F172A' : '#94A3B8',
                                fontWeight: isActive ? 600 : 500,
                              }}
                            >
                              {label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="app-tracker-saved-section">
        <button
          type="button"
          className="app-tracker-saved-widget"
          onClick={() => setShowSavedJobs((showing) => !showing)}
          aria-expanded={showSavedJobs}
        >
          <span className="app-tracker-saved-text">
            Saved Jobs ({savedJobs.length})
          </span>
          <ChevronRightRoundedIcon
            className={showSavedJobs ? 'app-tracker-saved-chevron expanded' : 'app-tracker-saved-chevron'}
            sx={{ fontSize: 20, color: '#64748B' }}
          />
        </button>

        {showSavedJobs && (
          <div className="app-tracker-saved-list">
            {savedJobs.length ? (
              savedJobs.map((savedJob) => (
                <article className="app-tracker-saved-item" key={savedJob._id}>
                  <h4>{savedJob.job?.title || 'Job listing unavailable'}</h4>
                  <p>{savedJob.job?.description || 'This saved job is no longer available.'}</p>
                </article>
              ))
            ) : (
              <p className="app-tracker-empty">Jobs you save will appear here.</p>
            )}
          </div>
        )}
      </section>
    </aside>
  );
};

export default ApplicationTracker;
