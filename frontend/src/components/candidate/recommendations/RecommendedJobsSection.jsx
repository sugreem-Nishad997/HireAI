import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CircularProgress from '@mui/material/CircularProgress';
import { recommendationApi } from '../../../api/client';
import RecommendedJobCard from './RecommendedJobCard';
import RecommendationProgress from './RecommendationProgress';
import FeedbackAlert from '../../common/FeedbackAlert';
import LoadingIndicator from '../../common/LoadingIndicator';
import '../../../styles/Recommendations.css';

export const RecommendedJobsSection = ({
  appliedJobIds = new Set(),
  savedJobIds = new Set(),
  savingJobId = null,
  actionErrors = {},
  onApply,
  onToggleSaved,
}) => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [resume, setResume] = useState(null);
  const [run, setRun] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const applyRecommendationsData = useCallback((data) => {
    setResume(data.resume);
    setJobs(data.jobs || []);
    setRun({
      status: data.runStatus,
      ...(data.progress || {}),
    });
    setPagination(data.pagination);
    setError('');
  }, []);

  const fetchRecommendations = useCallback(async (page = 1) => {
    try {
      const response = await recommendationApi.getRecommendedJobs({
        page,
        limit: pagination.limit,
      });
      applyRecommendationsData(response.data.data);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to load recommended jobs.',
      );
    } finally {
      setLoading(false);
    }
  }, [applyRecommendationsData, pagination.limit]);

  useEffect(() => {
    let active = true;

    recommendationApi
      .getRecommendedJobs({
        page: pagination.page,
        limit: pagination.limit,
      })
      .then((response) => {
        if (active) {
          applyRecommendationsData(response.data.data);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.data?.message || 'Unable to load recommended jobs.',
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [applyRecommendationsData, pagination.page, pagination.limit]);

  // Poll while recommendation generation is active
  useEffect(() => {
    if (!['queued', 'processing'].includes(run?.status)) {
      return undefined;
    }

    const intervalId = window.setInterval(async () => {
      try {
        const response = await recommendationApi.getRecommendationStatus();
        const statusData = response.data.data;

        setRun({
          status: statusData.status,
          ...(statusData.progress || {}),
        });

        if (!['queued', 'processing'].includes(statusData.status)) {
          fetchRecommendations(pagination.page);
        }
      } catch (err) {
        console.error('Recommendation status polling failed:', err);
      }
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [run?.status, pagination.page, fetchRecommendations]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError('');

      const response = await recommendationApi.refreshRecommendations();
      const data = response.data.data;

      setRun((previous) => ({
        ...previous,
        status: data.status,
      }));

      await fetchRecommendations(1);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to start recommendation generation.',
      );
    } finally {
      setRefreshing(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination((previous) => ({
      ...previous,
      page: newPage,
    }));
  };

  const isGenerating = ['queued', 'processing'].includes(run?.status);

  return (
    <section className="recommended-jobs-section" id="recommended-jobs">
      <div className="recommendations-heading">
        <div>
          <div className="recommendations-title-row">
            <AutoAwesomeRoundedIcon sx={{ color: '#2563EB', fontSize: 22 }} />
            <h2 className="recommendations-title">Recommended Jobs</h2>
          </div>
          <p className="recommendations-subtitle">
            Jobs ranked by how closely your resume matches their requirements.
          </p>
        </div>

        {resume && (
          <button
            type="button"
            className="refresh-recommendations-btn"
            onClick={handleRefresh}
            disabled={refreshing || isGenerating}
            title="Re-analyze jobs against your resume"
          >
            {refreshing ? (
              <>
                <CircularProgress size={14} color="inherit" />
                <span>Refreshing...</span>
              </>
            ) : isGenerating ? (
              <>
                <CircularProgress size={14} color="inherit" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <RefreshRoundedIcon sx={{ fontSize: 16 }} />
                <span>Refresh Recommendations</span>
              </>
            )}
          </button>
        )}
      </div>

      {error && <FeedbackAlert severity="error">{error}</FeedbackAlert>}

      {loading ? (
        <LoadingIndicator label="Loading recommended jobs..." />
      ) : !resume ? (
        <div className="recommendations-empty">
          <CloudUploadOutlinedIcon sx={{ fontSize: 44, color: '#94A3B8', mb: 1 }} />
          <h3>Upload a resume first</h3>
          <p>
            Upload and parse your resume to unlock AI-powered job recommendations tailored to your experience and skills.
          </p>
          <button
            type="button"
            onClick={() => navigate('/upload')}
            className="recommendations-empty-btn"
          >
            Upload Resume
          </button>
        </div>
      ) : (
        <>
          <div className="selected-resume">
            <div className="selected-resume-info">
              <span className="selected-resume-label">Resume used for matching:</span>
              <strong className="selected-resume-name">{resume.fileName}</strong>
            </div>
            <div className="selected-resume-actions">
              <small className="selected-resume-date">
                Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}
              </small>
              <Link to="/my-resumes" className="selected-resume-link">
                Manage Resumes
              </Link>
            </div>
          </div>

          <RecommendationProgress run={run} />

          {run?.status === 'not_started' && jobs.length === 0 && (
            <div className="recommendations-empty">
              <AutoAwesomeRoundedIcon sx={{ fontSize: 44, color: '#2563EB', mb: 1 }} />
              <h3>Ready to find your next opportunity?</h3>
              <p>
                Let AI analyze your resume against all active job postings to find your best matches.
              </p>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="recommendations-empty-btn"
              >
                {refreshing ? 'Starting...' : 'Generate Recommendations'}
              </button>
            </div>
          )}

          {jobs.length > 0 && (
            <>
              <div className="recommendations-results-heading">
                <h3>Jobs matching your profile</h3>
                <span>{pagination.total} recommendation{pagination.total === 1 ? '' : 's'}</span>
              </div>

              <div className="recommendations-card-list">
                {jobs.map((job) => (
                  <RecommendedJobCard
                    key={job.matchResultId || job.jobId}
                    recommendation={job}
                    appliedJobIds={appliedJobIds}
                    savedJobIds={savedJobIds}
                    savingJobId={savingJobId}
                    actionError={actionErrors[job.jobId || job._id]}
                    onApply={onApply}
                    onToggleSaved={onToggleSaved}
                  />
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="recommendations-pagination">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    Previous
                  </button>

                  <span>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}

          {jobs.length === 0 &&
            !isGenerating &&
            run?.status !== 'not_started' && (
              <div className="recommendations-empty">
                <h3>No recommendations available</h3>
                <p>
                  There are no generated matches for your current resume yet. Try refreshing or updating your resume skills.
                </p>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="recommendations-empty-btn"
                >
                  {refreshing ? 'Refreshing...' : 'Refresh Recommendations'}
                </button>
              </div>
            )}
        </>
      )}
    </section>
  );
};

export default RecommendedJobsSection;
