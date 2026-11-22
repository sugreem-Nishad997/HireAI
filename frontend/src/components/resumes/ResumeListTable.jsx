import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import StatusBadge from '../common/StatusBadge';
import FeedbackAlert from '../common/FeedbackAlert';
import { useResumes } from '../../context/ResumeContext';
import '../../styles/ResumeListTable.css';

export const ResumeListTable = () => {
  const { resumes, setActiveResumeId, deleteResume, loading, error } = useResumes();
  const [actionError, setActionError] = useState('');
  const [resumeToDelete, setResumeToDelete] = useState(null);
  const [deletingResumeId, setDeletingResumeId] = useState(null);
  const navigate = useNavigate();

  const handleView = (resumeId) => {
    setActiveResumeId(resumeId);
    navigate(`/resume/${encodeURIComponent(resumeId)}/view`);
  };

  const handleDelete = async () => {
    if (!resumeToDelete) return;
    const resumeId = resumeToDelete.id;
    setActionError('');
    setDeletingResumeId(resumeId);
    try {
      await deleteResume(resumeId);
      setResumeToDelete(null);
    } catch (deleteError) {
      setActionError(
        deleteError.response?.data?.message
          || deleteError.message
          || 'Unable to delete resume.',
      );
    } finally {
      setDeletingResumeId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="resume-list-header">
        <div>
          <h1 className="resume-list-title">My Resumes</h1>
          <p className="resume-list-subtitle">View and manage all your uploaded resumes</p>
        </div>

        <button onClick={() => navigate('/upload')} className="resume-list-upload-btn">
          <AddRoundedIcon sx={{ fontSize: 18 }} />
          <span>Upload Resume</span>
        </button>
      </div>

      {/* Resumes Table Card */}
      <div className="resume-list-card">
        <div className="resume-list-table-scroll">
          <table className="resume-list-table">
            <thead>
              <tr className="resume-list-thead-tr">
                <th className="resume-list-th">File Name</th>
                <th className="resume-list-th">Uploaded On</th>
                <th className="resume-list-th">Status</th>
                <th className="resume-list-th resume-list-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="4" className="resume-list-state">
                    <CircularProgress size={24} aria-label="Loading resumes" />
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan="4" className="resume-list-state">
                    <FeedbackAlert severity="error">{error}</FeedbackAlert>
                  </td>
                </tr>
              )}
              {!loading && !error && resumes.length === 0 && (
                <tr>
                  <td colSpan="4" className="resume-list-state">
                    You have not uploaded any resumes yet.
                  </td>
                </tr>
              )}
              {resumes.map((resume) => {
                const isPdf = resume.fileType === 'pdf' || resume.fileName.endsWith('.pdf');
                return (
                  <tr key={resume.id} className="resume-list-tr">
                    <td className="resume-list-td-file">
                      <div className="resume-list-file-cell">
                        <div
                          className="resume-list-file-icon"
                          style={{ color: isPdf ? '#EF4444' : '#2563EB' }}
                        >
                          {isPdf ? (
                            <PictureAsPdfRoundedIcon sx={{ fontSize: 24 }} />
                          ) : (
                            <DescriptionOutlinedIcon sx={{ fontSize: 24 }} />
                          )}
                        </div>
                        <span
                          onClick={() => handleView(resume.id)}
                          className="resume-list-filename"
                        >
                          {resume.fileName}
                        </span>
                      </div>
                    </td>

                    <td className="resume-list-td-date">{resume.uploadedOn}</td>
                    <td className="resume-list-td-status">
                      <StatusBadge status={resume.status} />
                    </td>

                    <td className="resume-list-td-actions">
                      <div className="resume-list-actions-group">
                        <button
                          onClick={() => handleView(resume.id)}
                          className="resume-list-view-btn"
                        >
                          View
                        </button>

                        <button
                                          type="button"
                                          onClick={() => setResumeToDelete(resume)}
                                          className="resume-list-delete-btn"
                                          aria-label={`Delete ${resume.fileName}`}
                                          title="Delete resume"
                                          disabled={deletingResumeId !== null}
                                        >
                                          <DeleteOutlineRoundedIcon sx={{ fontSize: 19 }} />
                                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {actionError && <FeedbackAlert severity="error">{actionError}</FeedbackAlert>}

        {/* Footer with Pagination */}
        <div className="resume-list-pagination">
          <span>Showing {resumes.length ? `1-${resumes.length}` : '0'} of {resumes.length}</span>

          <div className="resume-list-page-controls">
            <button disabled className="resume-list-page-btn">
              <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />
            </button>

            <button className="resume-list-page-btn active">1</button>

            <button disabled className="resume-list-page-btn">
              <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
            </button>
          </div>
        </div>
        <Dialog
          open={Boolean(resumeToDelete)}
          onClose={() => {
            if (deletingResumeId === null) setResumeToDelete(null);
          }}
          aria-labelledby="delete-resume-dialog-title"
          aria-describedby="delete-resume-dialog-description"
        >
          <DialogTitle id="delete-resume-dialog-title">Delete resume?</DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-resume-dialog-description">
              Are you sure you want to delete
              {resumeToDelete ? ` "${resumeToDelete.fileName}"` : ' this resume'}? This action cannot be undone.
            </DialogContentText>
            {actionError && <FeedbackAlert severity="error">{actionError}</FeedbackAlert>}
            {deletingResumeId !== null && (
              <CircularProgress
                size={22}
                aria-label="Deleting resume"
                sx={{display: 'block', mt: 2, mx: 'auto'}}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setResumeToDelete(null)}
              disabled={deletingResumeId !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              color="error"
              variant="contained"
              disabled={deletingResumeId !== null}
              autoFocus
            >
              {deletingResumeId !== null ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
};

export default ResumeListTable;
