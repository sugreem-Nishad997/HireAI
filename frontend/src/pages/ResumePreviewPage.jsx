import { useEffect, useState } from 'react';
import {
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import FeedbackAlert from '../components/common/FeedbackAlert';
import LoadingIndicator from '../components/common/LoadingIndicator';
import { resumeApi } from '../api/client';
import { useResumes } from '../context/ResumeContext';
import '../styles/ResumePreviewPage.css';

const getViewErrorMessage = async (error) => {
  const responseData = error.response?.data;

  if (responseData instanceof Blob) {
    try {
      const responseBody = JSON.parse(await responseData.text());
      if (responseBody.message) return responseBody.message;
    } catch {
      // Fall back to the original request error when the response is not JSON.
    }
  }

  return error.response?.data?.message
    || error.message
    || 'Unable to open this resume.';
};

export const ResumePreviewPage = () => {
  const { id, applicationId: routeApplicationId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const applicationId = routeApplicationId || searchParams.get('applicationId');
  const resumeId = id || null;
  const returnTo = location.state?.returnTo || '/my-resumes';
  const { getResumeById } = useResumes();
  const [previewState, setPreviewState] = useState(() => ({
    resumeId,
    applicationId,
    fileUrl: null,
    fileType: '',
    loading: true,
    error: '',
  }));

  useEffect(() => {
    let active = true;

    const fetchResume = async () => {
      try {
        const response = routeApplicationId
          ? await resumeApi.viewForApplication(routeApplicationId)
          : await resumeApi.view(resumeId, applicationId);
        const contentType = response.headers['content-type'] || '';

        if (
          !contentType.includes('application/pdf')
          && !contentType.includes('text/html')
        ) {
          throw new Error('Unsupported resume preview format.');
        }

        if (!response.data.size) {
          throw new Error('The server returned an empty resume file.');
        }

        const blob = new Blob([response.data], {type: contentType});
        const fileUrl = URL.createObjectURL(blob);
        if (active) {
          setPreviewState({
            resumeId,
            applicationId,
            fileUrl,
            fileType: contentType,
            loading: false,
            error: '',
          });
        } else {
          URL.revokeObjectURL(fileUrl);
        }
      } catch (viewError) {
        const errorMessage = await getViewErrorMessage(viewError);
        if (active) {
          setPreviewState({
            resumeId,
            applicationId,
            fileUrl: null,
            fileType: '',
            loading: false,
            error: errorMessage,
          });
        }
      }
    };

    if (resumeId || routeApplicationId) fetchResume();

    return () => {
      active = false;
    };
  }, [resumeId, applicationId, routeApplicationId]);

  useEffect(() => {
    const fileUrl = previewState.resumeId === resumeId
      && previewState.applicationId === applicationId
      ? previewState.fileUrl
      : null;

    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [
    resumeId,
    applicationId,
    previewState.applicationId,
    previewState.fileUrl,
    previewState.resumeId,
  ]);

  const isCurrentPreview = previewState.resumeId === resumeId
    && previewState.applicationId === applicationId;
  const loading = !isCurrentPreview || previewState.loading;
  const fileUrl = isCurrentPreview ? previewState.fileUrl : null;
  const fileType = isCurrentPreview ? previewState.fileType : '';
  const error = isCurrentPreview ? previewState.error : '';
  const fileName = getResumeById(resumeId)?.fileName || 'Resume preview';

  const handleDownload = () => {
    if (!fileUrl) return;

    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileType.includes('application/pdf')
      ? 'resume.pdf'
      : 'resume-preview.html';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <section className="resume-preview-page">
      <div className="resume-preview-header">
        <Link to={returnTo} className="resume-preview-back">
          {applicationId ? 'Back to applicants' : 'Back to My Resumes'}
        </Link>
        <div className="resume-preview-actions">
          {fileUrl && (
            <>
              <button
                type="button"
                onClick={handleDownload}
                className="resume-preview-action"
              >
                <DownloadOutlinedIcon sx={{fontSize: 18}} />
                <span>Download</span>
              </button>
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="resume-preview-action"
              >
                <OpenInNewRoundedIcon sx={{fontSize: 18}} />
                <span>Open in new tab</span>
              </a>
            </>
          )}
        </div>
      </div>

      {loading && <LoadingIndicator label="Loading your resume" />}
      {!loading && error && <FeedbackAlert severity="error">{error}</FeedbackAlert>}
      {!loading && fileUrl && (
        <>
          <h1 className="resume-preview-title">{fileName}</h1>
          <iframe
            className="resume-preview-frame"
            src={fileUrl}
            title={`Preview of ${fileName}`}
            sandbox={fileType.includes('text/html') ? '' : undefined}
          />
        </>
      )}
    </section>
  );
};

export default ResumePreviewPage;
