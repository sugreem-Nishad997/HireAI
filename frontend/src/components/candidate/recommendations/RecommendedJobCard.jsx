import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import BookmarkBorderRoundedIcon from '@mui/icons-material/BookmarkBorderRounded';
import BookmarkRoundedIcon from '@mui/icons-material/BookmarkRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import MatchScore from './MatchScore';
import MatchedSkills from './MatchedSkills';
import MissingSkills from './MissingSkills';

const RecommendedJobCard = ({
    recommendation,
    appliedJobIds = new Set(),
    savedJobIds = new Set(),
    savingJobId = null,
    actionError = '',
    onApply,
    onToggleSaved,
}) => {
    const navigate = useNavigate();
    const [showDetails, setShowDetails] = useState(false);

    const {
        jobId,
        title,
        recruiterName,
        description,
        minimumExperienceYears,
        matchScore,
        matchedSkills = [],
        missingRequiredSkills = [],
        relevantEvidence = [],
        experienceAssessment,
        summary,
        limitations = [],
        createdAt,
    } = recommendation;

    const currentJobId = String(jobId || recommendation._id || '');
    const isSaved = savedJobIds.has(currentJobId);
    const hasApplied = appliedJobIds.has(currentJobId);
    const isSaving = savingJobId === currentJobId;

    const hasMatchInsights = Boolean(
        summary ||
        (relevantEvidence && relevantEvidence.length > 0) ||
        experienceAssessment?.assessment ||
        (limitations && limitations.length > 0)
    );

    const handleApplyClick = () => {
        if (onApply) {
            onApply({ _id: currentJobId, title, recruiterName, ...recommendation });
        } else {
            navigate(`/jobs/${encodeURIComponent(currentJobId)}/apply`);
        }
    };

    const handleSaveClick = () => {
        if (onToggleSaved) {
            onToggleSaved({ _id: currentJobId, title, recruiterName, ...recommendation });
        }
    };

    return (
        <article className="recommended-job-card">
            <div className="recommended-job-header">
                <div>
                    <h3>{title}</h3>
                    <p className="recommended-job-company">
                        {recruiterName || 'Recruiter'}
                    </p>
                </div>

                <MatchScore score={matchScore} />
            </div>

            <div className="recommended-job-meta">
                <span>
                    <AutoAwesomeRoundedIcon fontSize="small" />
                    {minimumExperienceYears ?? 0}+ years experience
                </span>

                {createdAt && (
                    <span>
                        Posted {new Date(createdAt).toLocaleDateString()}
                    </span>
                )}
            </div>

            {description && (
                <p className="recommended-job-description">
                    {description.length > 220
                        ? `${description.slice(0, 220)}...`
                        : description}
                </p>
            )}

            <MatchedSkills skills={matchedSkills} />
            <MissingSkills skills={missingRequiredSkills} />

            {/* Expandable Match Insights */}
            {showDetails && hasMatchInsights && (
                <div className="recommended-job-match-breakdown">
                    {summary && (
                        <div className="rec-match-detail-row">
                            <strong>AI Match Summary:</strong>
                            <p>{summary}</p>
                        </div>
                    )}
                    {relevantEvidence?.length > 0 && (
                        <div className="rec-match-detail-row">
                            <strong>Relevant Resume Evidence:</strong>
                            <p>{relevantEvidence.join(' · ')}</p>
                        </div>
                    )}
                    {experienceAssessment?.assessment && (
                        <div className="rec-match-detail-row">
                            <strong>Experience Assessment:</strong>
                            <p>
                                {experienceAssessment.assessment}
                                {Number.isFinite(experienceAssessment.professionalExperienceYears) &&
                                    ` (${experienceAssessment.professionalExperienceYears} years)`}
                            </p>
                        </div>
                    )}
                    {limitations?.length > 0 && (
                        <div className="rec-match-detail-row">
                            <strong>Limitations:</strong>
                            <p>{limitations.join(' · ')}</p>
                        </div>
                    )}
                </div>
            )}

            {actionError && (
                <p className="rec-job-action-error">{actionError}</p>
            )}

            <div className="recommended-job-actions">
                {onToggleSaved && (
                    <button
                        type="button"
                        className="rec-job-save-btn"
                        onClick={handleSaveClick}
                        disabled={isSaving}
                        title={isSaved ? 'Remove from saved' : 'Save job'}
                        aria-label={isSaved ? 'Remove from saved' : 'Save job'}
                    >
                        {isSaved ? (
                            <BookmarkRoundedIcon sx={{ fontSize: 20 }} />
                        ) : (
                            <BookmarkBorderRoundedIcon sx={{ fontSize: 20 }} />
                        )}
                    </button>
                )}

                {hasMatchInsights && (
                    <button
                        type="button"
                        className="recommended-job-details-btn"
                        onClick={() => setShowDetails(!showDetails)}
                    >
                        <span>{showDetails ? 'Hide Match Details' : 'Match Details'}</span>
                        {showDetails ? (
                            <ExpandLessRoundedIcon sx={{ fontSize: 18 }} />
                        ) : (
                            <ExpandMoreRoundedIcon sx={{ fontSize: 18 }} />
                        )}
                    </button>
                )}

                <button
                    type="button"
                    className={`rec-job-apply-btn ${hasApplied ? 'applied' : ''}`}
                    onClick={handleApplyClick}
                    disabled={hasApplied}
                >
                    {hasApplied ? 'Applied' : 'Apply Now'}
                </button>
            </div>
        </article>
    );
};

export default RecommendedJobCard;
