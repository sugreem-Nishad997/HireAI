import React from 'react';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import '../../styles/OriginalFileViewer.css';

export const OriginalFileViewer = ({ resume }) => {
  if (!resume) return null;

  return (
    <div className="original-file-card">
      <div className="original-file-icon-box">
        <PictureAsPdfRoundedIcon sx={{ fontSize: 36 }} />
      </div>

      <h3 className="original-file-name">
        {resume.fileName}
      </h3>

      <p className="original-file-meta">
        PDF Document &nbsp;•&nbsp; {resume.fileSize || '1.2 MB'} &nbsp;•&nbsp; Ready for inspection
      </p>

      <div className="original-file-btn-group">
        <button
          onClick={() => alert(`Downloading ${resume.fileName}...`)}
          className="original-file-download-btn"
        >
          <FileDownloadOutlinedIcon sx={{ fontSize: 18 }} />
          <span>Download Original File</span>
        </button>

        <button
          onClick={() => alert('Opening preview modal...')}
          className="original-file-preview-btn"
        >
          <OpenInNewRoundedIcon sx={{ fontSize: 17 }} />
          <span>Preview in New Tab</span>
        </button>
      </div>
    </div>
  );
};

export default OriginalFileViewer;
