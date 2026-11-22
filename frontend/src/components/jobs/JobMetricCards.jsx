import SendRoundedIcon from '@mui/icons-material/SendRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import '../../styles/JobMetricCards.css';

export const JobMetricCards = ({ metrics = {} }) => {
  const cards = [
    {
      label: 'Applications Sent',
      value: metrics.applicationsSent ?? 0,
      change: 'Applied jobs',
      icon: SendRoundedIcon,
    },
    {
      label: 'Interviews',
      value: metrics.interviews ?? 0,
      change: 'Applications at interview stage',
      icon: CalendarTodayRoundedIcon,
    },
    {
      label: 'Seen by Recruiters',
      value: metrics.seenByRecruiters ?? 0,
      change: 'Applications viewed',
      icon: VisibilityOutlinedIcon,
    },
    {
      label: 'Response Rate',
      value: metrics.responseRate ?? '0%',
      change: 'Applications with a status update',
      icon: TrendingUpRoundedIcon,
    },
  ];

  return (
    <div className="job-metrics-grid">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div key={i} className="job-metric-card">
            <div className="job-metric-header">
              <span className="job-metric-label">{c.label}</span>
              <div className="job-metric-icon-circle">
                <Icon sx={{ fontSize: 16 }} />
              </div>
            </div>

            <div>
              <div className="job-metric-value">{c.value}</div>
              <div className="job-metric-change">{c.change}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default JobMetricCards;
