import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CircularProgress from '@mui/material/CircularProgress';
import '../../styles/RecruiterStats.css';

export const RecruiterStats = ({ metrics, loading }) => {
  const cards = [
    {
      title: 'Total Active Jobs',
      value: metrics?.activeJobs,
      detail: 'Recruiter-owned active listings',
      icon: BusinessCenterOutlinedIcon,
      iconBg: '#EFF6FF',
      iconColor: '#2563EB',
    },
    {
      title: 'Total Applicants',
      value: metrics?.totalApplicants,
      detail: 'Applications across your jobs',
      icon: PeopleAltOutlinedIcon,
      iconBg: '#EFF6FF',
      iconColor: '#2563EB',
    },
    {
      title: 'AI-Qualified Candidates',
      value: metrics?.aiQualifiedCandidates,
      detail: `Match score at least ${metrics?.aiQualifiedScoreThreshold ?? 70}%`,
      icon: AutoAwesomeRoundedIcon,
      iconBg: '#EFF6FF',
      iconColor: '#2563EB',
    },
  ];

  return (
    <div className="recruiter-stats-grid">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div key={i} className="recruiter-stat-card">
            <div
              className="recruiter-stat-icon-wrap"
              style={{ backgroundColor: c.iconBg, color: c.iconColor }}
            >
              <Icon sx={{ fontSize: 20 }} />
            </div>

            <div className="recruiter-stat-title">
              {c.title}
            </div>

            <div className="recruiter-stat-value">
              {loading
                ? <CircularProgress size={18} aria-label={`Loading ${c.title.toLowerCase()}`} />
                : metrics
                  ? (c.value ?? 0).toLocaleString()
                  : 'N/A'}
            </div>

            <div className="recruiter-stat-change">
              {c.detail}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RecruiterStats;
