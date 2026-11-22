import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import InfoAlert from '../common/InfoAlert';
import FeedbackAlert from '../common/FeedbackAlert';
import { useResumes } from '../../context/ResumeContext';
import '../../styles/ResumeUploadDropzone.css';

export const ResumeUploadDropzone = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const { uploadResume, setActiveResumeId } = useResumes();
  const navigate = useNavigate();

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    const isDoc = file.name.endsWith('.pdf') || file.name.endsWith('.docx') || file.name.endsWith('.doc');

    if (!isDoc && !validTypes.includes(file.type)) {
      alert('Please upload a PDF or DOCX file.');
      return;
    }

    setUploadingFile(file);
    setUploadError('');
    setProgress(0);
    setProgressStep('Uploading document...');

    try {
      const newId = await uploadResume(file, ({ loaded, total }) => {
        if (total) {
          setProgress(Math.min(Math.round((loaded / total) * 90), 90));
          setProgressStep('Uploading document...');
        }
      });
      setProgress(100);
      setProgressStep('Resume parsed successfully.');
      setTimeout(() => {
        setActiveResumeId(newId);
        navigate(`/resume/${newId}`);
      }, 500);
    } catch (error) {
      setUploadError(
        error.response?.data?.message || error.message || 'Unable to upload resume.',
      );
      setUploadingFile(null);
      setProgress(0);
      setProgressStep('');
    }
  };

  return (
    <div className="resume-upload-wrapper">
      {/* Page Header */}
      <div className="resume-upload-header">
        <h1 className="resume-upload-title">
          Upload Your Resume
        </h1>
        <p className="resume-upload-subtitle">
          Upload a PDF or DOCX file. We'll extract the text and parse it with AI.
        </p>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`resume-dropzone-box ${isDragging ? 'dragging' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {uploadingFile ? (
          <div className="resume-upload-progress-card">
            <div
              className="resume-upload-icon-circle"
              style={{
                backgroundColor: progress === 100 ? '#DCFCE7' : '#EFF6FF',
                color: progress === 100 ? '#16A34A' : '#2563EB',
              }}
            >
              {progress === 100 ? (
                <CheckCircleRoundedIcon sx={{ fontSize: 36 }} />
              ) : (
                <CloudUploadOutlinedIcon sx={{ fontSize: 36 }} />
              )}
            </div>

            <div className="resume-upload-filename">
              {uploadingFile.name}
            </div>
            <div className="resume-upload-step-text">
              {progressStep}
            </div>

            <div className="resume-progress-track">
              <div
                className="resume-progress-bar"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="resume-dropzone-cloud-icon">
              <CloudUploadOutlinedIcon sx={{ fontSize: 58 }} />
            </div>

            <h3 className="resume-dropzone-heading">
              Drag & drop your resume here
            </h3>

            <span className="resume-dropzone-or">
              or
            </span>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="resume-choose-file-btn"
            >
              Choose File
            </button>

            <span className="resume-dropzone-formats">
              Supported formats: PDF, DOCX | Max file size: 10MB
            </span>
          </>
        )}
      </div>

      {/* Info Alert Box */}
      {uploadError && (
        <FeedbackAlert severity="error">{uploadError}</FeedbackAlert>
      )}
      <InfoAlert message="Your resume will be securely stored and only you can access it." />
    </div>
  );
};

export default ResumeUploadDropzone;
