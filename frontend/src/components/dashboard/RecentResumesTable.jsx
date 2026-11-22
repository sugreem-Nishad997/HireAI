import { Link, useNavigate } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import FeedbackAlert from '../common/FeedbackAlert';
import LoadingIndicator from '../common/LoadingIndicator';
import { useResumes } from '../../context/ResumeContext';
import '../../styles/RecentResumesTable.css';

export const RecentResumesTable = () => {
  const { resumes, setActiveResumeId, loading, error } = useResumes();
  const navigate = useNavigate();

  const recentResumes = resumes.slice(0, 3);

  const handleView = (resumeId) => {
    setActiveResumeId(resumeId);
    navigate(`/resume/${encodeURIComponent(resumeId)}/view`);
  };

  return (
    <div className="recent-resumes-card">
      {/* Header */}
      <div className="recent-resumes-header">
        <h2 className="recent-resumes-title">Recent Resumes</h2>
        <Link to="/my-resumes" className="recent-resumes-view-all">
          View all
        </Link>
      </div>

      {/* Table */}
      <div className="recent-resumes-table-wrapper">
        <table className="recent-resumes-table">
          <thead>
            <tr className="recent-resumes-thead-tr">
              <th className="recent-resumes-th">File Name</th>
              <th className="recent-resumes-th">Uploaded On</th>
              <th className="recent-resumes-th">Status</th>
              <th className="recent-resumes-th recent-resumes-th-action">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="4">
                  <LoadingIndicator label="Loading your resumes" size={22} />
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan="4"><FeedbackAlert severity="error">{error}</FeedbackAlert></td>
              </tr>
            )}
            {!loading && !error && recentResumes.length === 0 && (
              <tr>
                <td colSpan="4">You have not uploaded any resumes yet.</td>
              </tr>
            )}
            {recentResumes.map((resume) => (
              <tr key={resume.id} className="recent-resumes-tr">
                <td className="recent-resumes-td-name">{resume.fileName}</td>
                <td className="recent-resumes-td-date">{resume.uploadedOn}</td>
                <td className="recent-resumes-td-status">
                  <StatusBadge status={resume.status} />
                </td>
                <td className="recent-resumes-td-action">
                  <button
                    onClick={() => handleView(resume.id)}
                    className="recent-resumes-view-btn"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentResumesTable;
