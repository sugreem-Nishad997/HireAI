import axios from 'axios';

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'https://hireai-3tsg.onrender.com/api/'
).replace(/\/+$/, '');

export const TOKEN_STORAGE_KEY = 'hireai_token';
const USER_STORAGE_KEY = 'hireai_user';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
      || sessionStorage.getItem(TOKEN_STORAGE_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthRequest = /^\/auth\//.test(requestUrl);

    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(USER_STORAGE_KEY);

      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }

    return Promise.reject(error);
  },
);

export const authApi = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  sendRegistrationOtp: (email) => api.post('/auth/send-registration-otp', { email }),
  verifyRegistrationOtp: (email, otp) => api.post('/auth/verify-registration-otp', { email, otp }),
  sendForgotPasswordOtp: (email) => api.post('/auth/forgot-password', { email }),
  verifyResetOtp: (email, otp) => api.post('/auth/verify-reset-otp', { email, otp }),
  resetPassword: ({ email, otp, newPassword }) =>
    api.post('/auth/reset-password', { email, otp, newPassword }),
};

export const profileApi = {
  getMine: () => api.get('/profile'),
  update: (profileData) => api.patch('/profile', profileData),
  updateAccount: (accountData) => api.patch('/profile/account', accountData),
  delete: () => api.delete('/profile'),
  deleteAccount: (password) => api.delete('/profile/account', { data: { password } }),
};

export const resumeApi = {
  upload: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('resume', file);

    return api.post('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
  },
  getMine: () => api.get('/resumes/mine'),
  getById: (resumeId) => api.get(`/resumes/${encodeURIComponent(resumeId)}`),
  view: (resumeId, applicationId) => api.get(
    `/resumes/${encodeURIComponent(resumeId)}/view`,
    {
      params: applicationId ? { applicationId } : undefined,
      responseType: 'blob',
    },
  ),
  viewForApplication: (applicationId) => api.get(
    '/resumes/view',
    {
      params: { applicationId },
      responseType: 'blob',
    },
  ),
  delete: (resumeId) => api.delete(`/resumes/${encodeURIComponent(resumeId)}`),
};

export const jobApi = {
  getAll: () => api.get('/jobs'),
  getById: (jobId) => api.get(`/jobs/${encodeURIComponent(jobId)}`),
  create: (jobData) => api.post('/jobs', jobData),
  getSaved: () => api.get('/jobs/saved/mine'),
  save: (jobId) => api.put(`/jobs/${encodeURIComponent(jobId)}/saved`),
  unsave: (jobId) => api.delete(`/jobs/${encodeURIComponent(jobId)}/saved`),
  update: (jobId, jobData) =>
    api.patch(`/jobs/${encodeURIComponent(jobId)}`, jobData),
  deactivate: (jobId) => api.delete(`/jobs/${encodeURIComponent(jobId)}`),
};

export const applicationApi = {
  applyToJob: (jobId, resumeId) =>
    api.post(`/applications/jobs/${encodeURIComponent(jobId)}`, { resumeId }),
  getMine: () => api.get('/applications/mine'),
  getForJob: (jobId) =>
    api.get(`/applications/jobs/${encodeURIComponent(jobId)}`),
  updateStatus: (applicationId, status, note = '') =>
    api.patch(
      `/applications/${encodeURIComponent(applicationId)}/status`,
      { status, note },
    ),
};

export const candidateMatchingApi = {
  matchCandidatesForJob: (jobId) =>
    api.post(`/candidate-matching/${encodeURIComponent(jobId)}/match`),
};

export const recruiterApi = {
  getDashboard: () => api.get('/recruiter/dashboard'),
};


export const recommendationApi = {
  // Get recommended jobs with pagination
  getRecommendedJobs: (params = {}) =>
    api.get("/candidate/recommendations", { params }),

  // Start or refresh job recommendations
  refreshRecommendations: () =>
    api.post("/candidate/recommendations/refresh"),

  // Get recommendation processing status
  getRecommendationStatus: () =>
    api.get("/candidate/recommendations/status"),

  // Get detailed match information for a job
  getRecommendedJobDetails: (jobId) =>
    api.get(`/candidate/recommendations/${encodeURIComponent(jobId)}`),
};

export default api;