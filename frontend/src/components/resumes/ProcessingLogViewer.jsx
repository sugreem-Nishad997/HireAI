import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import '../../styles/ProcessingLogViewer.css';

export const ProcessingLogViewer = ({ resume }) => {
  if (!resume) return null;

  const logs = resume.aiLogs || [];

  return (
    <div className="processing-log-card">
      <div className="processing-log-header">
        <AutoAwesomeRoundedIcon sx={{ fontSize: 20, color: '#2563EB' }} />
        <h3 className="processing-log-title">
          AI Processing & Extraction Timeline
        </h3>
      </div>

      <div className="processing-log-list">
        {logs.length ? (
          logs.map((log, index) => (
            <div key={index} className="processing-log-item">
              <div className="processing-log-check">
                <CheckCircleRoundedIcon sx={{ fontSize: 20 }} />
              </div>

              <div className="processing-log-content">
                <span className="processing-log-step">
                  {log.step}
                </span>
                <span className="processing-log-time">
                  {log.time}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p>No processing activity is available for this resume.</p>
        )}
      </div>
    </div>
  );
};

export default ProcessingLogViewer;
