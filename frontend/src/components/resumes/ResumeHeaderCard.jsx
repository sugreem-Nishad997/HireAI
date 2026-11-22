import React from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import StatusBadge from '../common/StatusBadge';
import '../../styles/ResumeHeaderCard.css';

export const ResumeHeaderCard = ({ resume }) => {
  const navigate = useNavigate();

  if (!resume) return null;

  const isPdf = resume.fileType === 'pdf' || resume.fileName.endsWith('.pdf');

  return (
    <div className="resume-header-card-wrapper">
      {/* Back button link */}
      <button
        onClick={() => navigate('/my-resumes')}
        className="resume-back-link-btn"
      >
        <ArrowBackRoundedIcon sx={{ fontSize: 16 }} />
        <span>Back to My Resumes</span>
      </button>

      {/* File Card Banner */}
      <div className="resume-header-card-body">
        <div className="resume-header-file-group">
          <div
            className={`resume-header-icon-box ${isPdf ? 'pdf' : 'docx'}`}
          >
            {isPdf ? (
              <PictureAsPdfRoundedIcon sx={{ fontSize: 26 }} />
            ) : (
              <DescriptionOutlinedIcon sx={{ fontSize: 26 }} />
            )}
          </div>

          <div>
            <h2 className="resume-header-filename">
              {resume.fileName}
            </h2>
            <div className="resume-header-meta">
              Uploaded on {resume.uploadedOn} &nbsp;|&nbsp; {resume.fileSize || '1.2 MB'}
            </div>
          </div>
        </div>

        <div>
          <StatusBadge status={resume.status} />
        </div>
      </div>
    </div>
  );
};

export default ResumeHeaderCard;
