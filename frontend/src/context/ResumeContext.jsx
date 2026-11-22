import { createContext, useContext, useEffect, useState } from 'react';
import { resumeApi } from '../api/client';
import { useAuth } from './AuthContext';

const ResumeContext = createContext(null);

const formatFileSize = (size) => {
  if (!Number.isFinite(size)) return 'Unknown size';
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const formatUploadedDate = (date) => {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return 'Unknown date';

  return parsedDate.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const normalizeResume = (record) => {
  const id = record._id || record.resumeId || record.id;
  if (!id) {
    throw new Error('The server returned a resume without an ID.');
  }

  const file = record.file || {};
  const parsing = record.parsing || {};
  const parsedData = record.parsedData || {};
  const fileName = file.originalName || record.originalName || record.fileName || 'Resume';
  const mimeType = file.mimeType || record.mimeType || '';
  const extension = fileName.split('.').pop()?.toLowerCase();
  const status = parsing.status || record.parsingStatus || record.status || 'pending';

  return {
    id: String(id),
    fileName,
    fileType: mimeType.includes('pdf') || extension === 'pdf' ? 'pdf' : 'docx',
    fileSize: formatFileSize(file.size ?? record.size),
    uploadedOn: formatUploadedDate(record.createdAt || new Date()),
    status: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
    personalInfo: {
      fullName: parsedData.fullName || '',
      email: parsedData.email || '',
      phone: parsedData.phone || '',
      summary: parsedData.summary || '',
    },
    skills: parsedData.skills || [],
    education: parsedData.education || [],
    experience: (parsedData.experience || []).map((experience) => ({
      ...experience,
      period: experience.period
        || [experience.startDate, experience.endDate].filter(Boolean).join(' - '),
    })),
    projects: parsedData.projects || [],
    aiLogs: [],
  };
};

const getErrorMessage = (error) =>
  error.response?.data?.message || error.message || 'Unable to load resumes.';

export const ResumeProvider = ({ children }) => {
  const { user } = useAuth();
  const [resumeState, setResumeState] = useState({
    userId: null,
    resumes: [],
    loading: false,
    error: null,
  });
  const [activeResumeId, setActiveResumeId] = useState(null);
  const isCandidate = user?.role === 'candidate';
  const isCurrentUserState = isCandidate && resumeState.userId === user.id;
  const resumes = isCurrentUserState ? resumeState.resumes : [];
  const loading = isCandidate
    && (!isCurrentUserState || resumeState.loading);
  const error = isCurrentUserState ? resumeState.error : null;

  useEffect(() => {
    if (!user?.id || user.role !== 'candidate') return undefined;

    let active = true;
    resumeApi.getMine()
      .then(({ data }) => {
        if (!Array.isArray(data.data)) {
          throw new Error('The server returned an invalid resume list.');
        }

        const userResumes = data.data.map(normalizeResume);
        if (active) {
          setResumeState({
            userId: user.id,
            resumes: userResumes,
            loading: false,
            error: null,
          });
        }
      })
      .catch((fetchError) => {
        if (active) {
          setResumeState({
            userId: user.id,
            resumes: [],
            loading: false,
            error: getErrorMessage(fetchError),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [user?.id, user?.role]);

  const stats = {
    total: resumes.length,
    completed: resumes.filter((resume) => resume.status === 'Completed').length,
    pending: resumes.filter(
      (resume) => resume.status === 'Pending' || resume.status === 'Processing',
    ).length,
    failed: resumes.filter((resume) => resume.status === 'Failed').length,
  };

  const getResumeById = (id) => resumes.find((resume) => resume.id === id);

  const uploadResume = async (file, onUploadProgress) => {
    const { data } = await resumeApi.upload(file, onUploadProgress);
    const newResume = normalizeResume({
      ...data.data,
      createdAt: new Date().toISOString(),
    });

    setResumeState((previousState) => {
      if (previousState.userId !== user?.id) return previousState;
      return {
        ...previousState,
        resumes: [newResume, ...previousState.resumes],
        error: null,
      };
    });

    return newResume.id;
  };

  const deleteResume = async (id) => {
    await resumeApi.delete(id);
    setResumeState((previousState) => {
      if (previousState.userId !== user?.id) return previousState;
      return {
        ...previousState,
        resumes: previousState.resumes.filter((resume) => resume.id !== id),
      };
    });
  };

  return (
    <ResumeContext.Provider
      value={{
        resumes,
        stats,
        loading,
        error,
        activeResumeId,
        setActiveResumeId,
        getResumeById,
        uploadResume,
        deleteResume,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useResumes = () => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResumes must be used within a ResumeProvider');
  }
  return context;
};
