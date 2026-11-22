import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { Drawer, IconButton } from '@mui/material';
import FeedbackAlert from '../components/common/FeedbackAlert';
import LoadingIndicator from '../components/common/LoadingIndicator';
import { useAuth } from '../context/AuthContext';
import { applicationApi, jobApi } from '../api/client';
import '../styles/RecruiterJobsPage.css';

const getErrorMessage = (error) =>
  error.response?.data?.message || error.message || 'Unable to load applicants.';

const applicationStatuses = [
  'pending',
  'reviewing',
  'shortlisted',
  'interview',
  'accepted',
  'rejected',
];

const applicantFilters = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'reviewing', label: 'Reviewing' },
  { id: 'shortlisted', label: 'Shortlisted' },
  { id: 'interview', label: 'Interview' },
];

const getStatusLabel = (status) => ({
  pending: 'Pending',
  reviewing: 'Reviewing',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  accepted: 'Accepted',
  rejected: 'Rejected',
}[status] || 'Pending');

const getResumeId = (resume) =>
  typeof resume === 'string' ? resume : resume?._id || resume?.id;

const formatDate = (date, includeTime = false) => {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return 'Date unavailable';

  return parsedDate.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(includeTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
};

export const RecruiterJobApplicantsPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedApplicationId, setExpandedApplicationId] = useState(null);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [nextStatus, setNextStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [statusSaved, setStatusSaved] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let active = true;

    Promise.all([
      jobApi.getById(jobId),
      applicationApi.getForJob(jobId),
    ])
      .then(([jobResponse, applicationsResponse]) => {
        if (!jobResponse.data.data?._id || !Array.isArray(applicationsResponse.data.data)) {
          throw new Error('The server returned invalid job or applicant data.');
        }
        if (active) {
          setJob(jobResponse.data.data);
          setApplications(applicationsResponse.data.data);
        }
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
  }, [jobId]);

  const renderMatchDetails = (matchResult) => (
    <div className="recruiter-job-match-details">
      <div className="recruiter-job-match-detail">
        <strong>Matched required skills</strong>
        <span>{matchResult?.matchedSkills?.length
          ? matchResult.matchedSkills.join(', ')
          : 'No matched skills available.'}</span>
      </div>
      <div className="recruiter-job-match-detail">
        <strong>Missing required skills</strong>
        <span>{matchResult?.missingRequiredSkills?.length
          ? matchResult.missingRequiredSkills.join(', ')
          : 'No missing skills reported.'}</span>
      </div>
      <div className="recruiter-job-match-detail">
        <strong>Relevant resume evidence</strong>
        <span>{matchResult?.relevantEvidence?.length
          ? matchResult.relevantEvidence.join(' · ')
          : 'No evidence available.'}</span>
      </div>
      <div className="recruiter-job-match-detail">
        <strong>Professional experience assessment</strong>
        <span>
          {matchResult?.experienceAssessment?.assessment || 'Not available.'}
          {Number.isFinite(matchResult?.experienceAssessment?.professionalExperienceYears)
            ? ` (${matchResult.experienceAssessment.professionalExperienceYears} years)`
            : ''}
        </span>
      </div>
      <div className="recruiter-job-match-detail">
        <strong>Project experience</strong>
        <span>{matchResult?.experienceAssessment?.projectExperience?.length
          ? matchResult.experienceAssessment.projectExperience.join(' · ')
          : 'No project experience reported.'}</span>
      </div>
      <div className="recruiter-job-match-detail">
        <strong>AI evaluation limitations</strong>
        <span>{matchResult?.limitations?.length
          ? matchResult.limitations.join(' · ')
          : 'No limitations reported.'}</span>
      </div>
    </div>
  );

  const openCandidateProfile = (application) => {
    setSelectedApplicant(application);
    setNextStatus(application.status || 'pending');
    setStatusNote('');
    setProfileError('');
  };

  const openResumePreview = (application) => {
    if (!application._id) {
      setProfileError('Application is unavailable.');
      return;
    }

    navigate({
      pathname: `/resume/application/${encodeURIComponent(application._id)}/view`,
    }, {
      state: {returnTo: `/jobs/${encodeURIComponent(jobId)}/applicants`},
    });
  };

  const updateCandidateStatus = async (event) => {
    event.preventDefault();
    if (!selectedApplicant || nextStatus === selectedApplicant.status) return;

    setSavingStatus(true);
    setProfileError('');
    setStatusSaved(false);
    try {
      const { data } = await applicationApi.updateStatus(
        selectedApplicant._id,
        nextStatus,
        statusNote,
      );
      const updatedApplication = data.data;
      const updatedStatusHistory = updatedApplication.statusHistory
        || [...(selectedApplicant.statusHistory || []), {
          previousStatus: selectedApplicant.status,
          newStatus: nextStatus,
          note: statusNote,
          changedAt: new Date().toISOString(),
        }];
      const mergedApplication = {
        ...selectedApplicant,
        ...updatedApplication,
        statusHistory: updatedStatusHistory,
      };

      setApplications((currentApplications) => currentApplications.map((application) =>
        application._id === selectedApplicant._id ? mergedApplication : application
      ));
      setSelectedApplicant(mergedApplication);
      setStatusNote('');
      setStatusSaved(true);
    } catch (updateError) {
      setProfileError(getErrorMessage(updateError));
    } finally {
      setSavingStatus(false);
    }
  };

  const strongMatchCount = applications.filter(
    ({ matchResult }) => Number.isFinite(matchResult?.matchScore) && matchResult.matchScore >= 70
  ).length;
  const shortlistedCount = applications.filter(
    ({ status }) => status === 'shortlisted'
  ).length;
  const filteredApplicants = applications
    .filter((application) => {
      const candidate = application.candidate || {};
      const query = searchTerm.trim().toLowerCase();
      const matchesSearch = !query
        || candidate.name?.toLowerCase().includes(query)
        || candidate.email?.toLowerCase().includes(query)
        || application.matchResult?.matchedSkills?.some((skill) => skill.toLowerCase().includes(query));
      const matchesStatus = statusFilter === 'all'
        || (application.status || 'pending') === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((left, right) =>
      (right.matchResult?.matchScore ?? -1) - (left.matchResult?.matchScore ?? -1)
    );

  return (
    <main className="recruiter-jobs-page recruiter-job-applicants-page animate-fade-in">
      <button
        type="button"
        className="recruiter-jobs-back-button"
        onClick={() => navigate('/jobs')}
      >
        <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
        Back to jobs
      </button>

      {loading ? (
        <LoadingIndicator label="Loading applicants" />
      ) : error ? (
        <FeedbackAlert severity="error">{error}</FeedbackAlert>
      ) : (
        <>
          <header className="recruiter-job-applicants-header">
            <div>
              <h1>{job.title}</h1>
              <p>Applications dashboard · {user?.name || 'Recruiter workspace'}</p>
            </div>
            <button
              type="button"
              className="recruiter-job-preview-button"
              onClick={() => navigate(`/jobs/${jobId}`)}
            >
              Preview job
            </button>
          </header>

          <section className="recruiter-applicant-metrics" aria-label="Applicant summary">
            <div>
              <strong>{applications.length}</strong>
              <span>Total applicants</span>
            </div>
            <div>
              <strong className="strong-match-value">{strongMatchCount}</strong>
              <span>Strong matches</span>
            </div>
            <div>
              <strong className="shortlisted-value">{shortlistedCount}</strong>
              <span>Shortlisted</span>
            </div>
          </section>

          <section className="recruiter-applicant-controls" aria-label="Filter applicants">
            <h2>Applicants</h2>
            <div className="recruiter-applicant-search-wrap">
              <SearchRoundedIcon sx={{ fontSize: 19 }} aria-hidden="true" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search candidates..."
                aria-label="Search candidates"
              />
            </div>
            <div className="recruiter-applicant-filter-list" role="group" aria-label="Application status">
              {applicantFilters.map((filter) => {
                const count = filter.id === 'all'
                  ? applications.length
                  : applications.filter(({ status }) => (status || 'pending') === filter.id).length;
                return (
                  <button
                    type="button"
                    key={filter.id}
                    className={`recruiter-applicant-filter ${statusFilter === filter.id ? 'selected' : ''}`}
                    onClick={() => setStatusFilter(filter.id)}
                    aria-pressed={statusFilter === filter.id}
                  >
                    {filter.label} <span>{count}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="recruiter-applicants-ranked" aria-label="Top AI-matched candidates">
            <h2>Top AI-matched candidates</h2>
            {applications.length === 0 ? (
              <div className="recruiter-jobs-state">No applicants for this job yet.</div>
            ) : filteredApplicants.length === 0 ? (
              <div className="recruiter-jobs-state">No candidates match these filters.</div>
            ) : (
              <div className="recruiter-job-applicants-list">
                {filteredApplicants.map((application) => {
                const isExpanded = expandedApplicationId === application._id;
                const matchResult = application.matchResult;
                const candidateName = application.candidate?.name || 'Candidate';
                const experienceYears = matchResult?.experienceAssessment?.professionalExperienceYears;

                return (
                  <article className="recruiter-job-applicant" key={application._id}>
                    <div className="recruiter-job-applicant-summary">
                      <button
                        type="button"
                        className="recruiter-job-applicant-expand"
                        onClick={() => setExpandedApplicationId(
                          isExpanded ? null : application._id,
                        )}
                        aria-label={`${isExpanded ? 'Hide' : 'Show'} match details for ${application.candidate?.name || 'candidate'}`}
                        aria-expanded={isExpanded}
                      >
                        <ChevronRightRoundedIcon
                          className={isExpanded ? 'expanded' : ''}
                          sx={{ fontSize: 20 }}
                        />
                      </button>
                      <div className="recruiter-applicant-avatar" aria-hidden="true">
                        {candidateName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong>{candidateName}</strong>
                        {application.candidate?.email && (
                          <span>{application.candidate.email}</span>
                        )}
                        <span className="recruiter-applicant-experience">
                          {Number.isFinite(experienceYears)
                            ? `${experienceYears} years experience · `
                            : ''}
                          Applied {formatDate(application.createdAt)}
                        </span>
                        <div className="recruiter-applicant-skills" aria-label="Matched skills">
                          {matchResult?.matchedSkills?.slice(0, 4).map((skill) => (
                            <span key={skill}>{skill}</span>
                          ))}
                        </div>
                        {matchResult?.missingRequiredSkills?.length > 0 && (
                          <span className="recruiter-applicant-missing-skills">
                            Missing: {matchResult.missingRequiredSkills.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="recruiter-job-applicant-meta">
                      <span className={`recruiter-job-match-score ${Number.isFinite(matchResult?.matchScore) && matchResult.matchScore >= 70 ? 'strong' : ''}`}>
                        {Number.isFinite(matchResult?.matchScore)
                          ? `${matchResult.matchScore}% match`
                          : application.matchingStatus === 'failed'
                            ? 'Match unavailable'
                            : 'Score pending'}
                      </span>
                      <span className={`recruiter-applicant-status ${application.status || 'pending'}`}>
                        {getStatusLabel(application.status)}
                      </span>
                      <button
                        type="button"
                        className="recruiter-applicant-profile-button"
                        onClick={() => openCandidateProfile(application)}
                      >
                        View profile <span aria-hidden="true">→</span>
                      </button>
                    </div>
                    {isExpanded && renderMatchDetails(matchResult)}
                  </article>
                );
                })}
              </div>
            )}
          </section>
        </>
      )}

      <Drawer
        anchor="right"
        open={Boolean(selectedApplicant)}
        onClose={() => setSelectedApplicant(null)}
        PaperProps={{ className: 'recruiter-candidate-profile-drawer' }}
      >
        {selectedApplicant && (() => {
          const candidate = selectedApplicant.candidate || {};
          const resume = selectedApplicant.resume || {};
          const matchResult = selectedApplicant.matchResult || {};
          const score = matchResult.matchScore;
          const history = [...(selectedApplicant.statusHistory || [])]
            .sort((left, right) => new Date(left.changedAt) - new Date(right.changedAt));

          return (
            <div
              className="recruiter-candidate-profile"
              role="dialog"
              aria-modal="true"
              aria-labelledby="recruiter-candidate-profile-title"
            >
              <header className="recruiter-candidate-profile-header">
                <div className="recruiter-candidate-profile-identity">
                  <div className="recruiter-candidate-avatar" aria-hidden="true">
                    {(candidate.name || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 id="recruiter-candidate-profile-title">
                      {candidate.name || 'Candidate'}
                    </h2>
                    {candidate.email && <p>{candidate.email}</p>}
                    <span>
                      {Number.isFinite(matchResult.experienceAssessment?.professionalExperienceYears)
                        ? `${matchResult.experienceAssessment.professionalExperienceYears} years experience · `
                        : ''}
                      Applied {formatDate(selectedApplicant.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="recruiter-candidate-profile-actions">
                  {Number.isFinite(score) && (
                    <span className="recruiter-candidate-score-pill">{score}/100</span>
                  )}
                  <IconButton
                    aria-label="Close candidate profile"
                    onClick={() => setSelectedApplicant(null)}
                    size="small"
                  >
                    <CloseRoundedIcon />
                  </IconButton>
                </div>
              </header>

              <section className="recruiter-candidate-profile-section">
                <h3>AI Candidate Evaluation</h3>
                <div className="recruiter-candidate-score-row">
                  <strong>{Number.isFinite(score) ? `${score} / 100` : 'Match pending'}</strong>
                </div>
                {Number.isFinite(score) && (
                  <div
                    className="recruiter-candidate-score-track"
                    role="progressbar"
                    aria-label="AI candidate match score"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={score}
                  >
                    <span style={{ width: `${score}%` }} />
                  </div>
                )}
                {matchResult.summary && (
                  <p className="recruiter-candidate-match-summary">{matchResult.summary}</p>
                )}

                <div className="recruiter-candidate-profile-skills">
                  <div>
                    <h4>Matched skills</h4>
                    {matchResult.matchedSkills?.length ? (
                      <ul className="recruiter-candidate-skill-list matched">
                        {matchResult.matchedSkills.map((skill) => <li key={skill}>{skill}</li>)}
                      </ul>
                    ) : <p className="recruiter-candidate-profile-muted">No matched skills available.</p>}
                  </div>
                  <div>
                    <h4>Missing required skills</h4>
                    {matchResult.missingRequiredSkills?.length ? (
                      <ul className="recruiter-candidate-skill-list missing">
                        {matchResult.missingRequiredSkills.map((skill) => <li key={skill}>{skill}</li>)}
                      </ul>
                    ) : <p className="recruiter-candidate-profile-muted">No missing skills reported.</p>}
                  </div>
                </div>

                <div className="recruiter-candidate-evidence">
                  <h4>Relevant evidence</h4>
                  {matchResult.relevantEvidence?.length ? (
                    <ul>
                      {matchResult.relevantEvidence.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  ) : <p className="recruiter-candidate-profile-muted">No evidence available.</p>}
                </div>
                {matchResult.experienceAssessment?.assessment && (
                  <div className="recruiter-candidate-evidence">
                    <h4>Experience assessment</h4>
                    <p>{matchResult.experienceAssessment.assessment}</p>
                  </div>
                )}
              </section>

              <section className="recruiter-candidate-profile-section">
                <h3>Update application status</h3>
                <p className="recruiter-candidate-current-status">
                  Current status: <strong>{getStatusLabel(selectedApplicant.status)}</strong>
                </p>
                <form className="recruiter-candidate-status-form" onSubmit={updateCandidateStatus}>
                  <label htmlFor="candidate-next-status">New status</label>
                  <select
                    id="candidate-next-status"
                    value={nextStatus}
                    onChange={(event) => setNextStatus(event.target.value)}
                  >
                    {applicationStatuses.map((status) => (
                      <option key={status} value={status}>{getStatusLabel(status)}</option>
                    ))}
                  </select>
                  <label htmlFor="candidate-status-note">Candidate-visible status note</label>
                  <textarea
                    id="candidate-status-note"
                    value={statusNote}
                    onChange={(event) => setStatusNote(event.target.value)}
                    maxLength={1000}
                    rows={3}
                    placeholder="Add an update for the candidate"
                  />
                  {profileError && <FeedbackAlert severity="error">{profileError}</FeedbackAlert>}
                  {statusSaved && <FeedbackAlert severity="success">Application status updated.</FeedbackAlert>}
                  <button
                    type="submit"
                    className="recruiter-candidate-save-status"
                    disabled={savingStatus || nextStatus === selectedApplicant.status}
                  >
                    {savingStatus ? 'Saving...' : 'Save status'}
                  </button>
                </form>
              </section>

              <section className="recruiter-candidate-profile-section">
                <h3>Application timeline</h3>
                <ol className="recruiter-candidate-timeline">
                  {history.length ? history.map((event) => (
                    <li key={event._id}>
                      <span className="recruiter-candidate-timeline-marker" aria-hidden="true" />
                      <div>
                        <strong>{getStatusLabel(event.newStatus)}</strong>
                        <time dateTime={event.changedAt}>{formatDate(event.changedAt, true)}</time>
                        {event.note && <p>{event.note}</p>}
                      </div>
                    </li>
                  )) : (
                    <li>
                      <span className="recruiter-candidate-timeline-marker" aria-hidden="true" />
                      <div>
                        <strong>Application submitted</strong>
                        <time dateTime={selectedApplicant.createdAt}>
                          {formatDate(selectedApplicant.createdAt, true)}
                        </time>
                      </div>
                    </li>
                  )}
                </ol>
              </section>

              <section className="recruiter-candidate-profile-section recruiter-candidate-resume-section">
                <h3>Resume</h3>
                <div className="recruiter-candidate-resume-row">
                  <span>
                    {resume.file?.originalName
                      || (getResumeId(resume) ? 'Resume attached' : 'Resume unavailable')}
                  </span>
                  {resume.parsing?.status && (
                    <span className="recruiter-candidate-resume-state">
                      {resume.parsing.status === 'completed' ? 'Ready' : getStatusLabel(resume.parsing.status)}
                    </span>
                  )}
                  {selectedApplicant._id && (
                    <button
                      type="button"
                      className="recruiter-candidate-view-resume"
                      onClick={() => openResumePreview(selectedApplicant)}
                    >
                      View Resume
                    </button>
                  )}
                </div>
              </section>
            </div>
          );
        })()}
      </Drawer>
    </main>
  );
};

export default RecruiterJobApplicantsPage;
