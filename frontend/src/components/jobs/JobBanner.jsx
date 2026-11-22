import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import '../../styles/JobBanner.css';

export const JobBanner = ({
  candidateName = 'Candidate',
  availableJobs = 0,
  applicationCount = 0,
  onAction,
}) => {
  return (
    <div className="job-banner-card">
      <h2 className="job-banner-title">
        Welcome back, {candidateName}!
      </h2>

      <p className="job-banner-description">
        Browse {availableJobs} active jobs posted by recruiters. You have sent {applicationCount} applications.
      </p>

      <div className="job-banner-action-wrap">
        <button onClick={onAction} className="job-banner-btn">
          <span>Browse Jobs</span>
          <AutoAwesomeRoundedIcon sx={{ fontSize: 16 }} />
        </button>
      </div>
    </div>
  );
};

export default JobBanner;
