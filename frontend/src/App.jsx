import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ResumeProvider } from './context/ResumeContext';
import MainLayout from './components/layout/MainLayout';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import UploadResumePage from './pages/UploadResumePage';
import MyResumesPage from './pages/MyResumesPage';
import ResumeDetailPage from './pages/ResumeDetailPage';
import ResumePreviewPage from './pages/ResumePreviewPage';
import ProfilePage from './pages/ProfilePage';
import CandidateJobsPage from './pages/CandidateJobsPage';
import CandidateBrowseJobsPage from './pages/CandidateBrowseJobsPage';
import JobApplicationPage from './pages/JobApplicationPage';
import MyApplicationsPage from './pages/MyApplicationsPage';
import RecruiterDashboardPage from './pages/RecruiterDashboardPage';
import RecruiterJobsPage from './pages/RecruiterJobsPage';
import RecruiterJobFormPage from './pages/RecruiterJobFormPage';
import RecruiterJobDetailPage from './pages/RecruiterJobDetailPage';
import RecruiterJobApplicantsPage from './pages/RecruiterJobApplicantsPage';
import SettingsPage from './pages/SettingsPage';
import RecommendedJobsPage from './pages/candidate/RecommendedJobsPage';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const RecruiterRoute = ({ children }) => {
  const { user } = useAuth();
  return user?.role === 'recruiter'
    ? children
    : <Navigate to="/dashboard" replace />;
};

const CandidateRoute = ({ children }) => {
  const { user } = useAuth();
  return user?.role === 'candidate'
    ? children
    : <Navigate to="/dashboard" replace />;
};

const DashboardRoute = () => {
  const { user } = useAuth();
  return user?.role === 'recruiter'
    ? <RecruiterDashboardPage />
    : <DashboardPage />;
};

const JobsRoute = () => {
  const { user } = useAuth();
  return user?.role === 'recruiter'
    ? <RecruiterJobsPage />
    : <CandidateJobsPage />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Auth Page */}
      <Route path="/login" element={<AuthPage />} />

      {/* Main Application with Sidebar & Header Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardRoute />} />
        <Route path="upload" element={<UploadResumePage />} />
        <Route path="my-resumes" element={<MyResumesPage />} />
        <Route
          path="my-applications"
          element={
            <CandidateRoute>
              <MyApplicationsPage />
            </CandidateRoute>
          }
        />
        <Route path="resume/:id" element={<ResumeDetailPage />} />
        <Route
          path="resume/application/:applicationId/view"
          element={<ResumePreviewPage />}
        />
        <Route path="resume/:id/view" element={<ResumePreviewPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="jobs" element={<JobsRoute />} />
        <Route
          path="jobs/browse"
          element={
            <CandidateRoute>
              <CandidateBrowseJobsPage />
            </CandidateRoute>
          }
        />
        <Route
          path="jobs/:jobId/apply"
          element={
            <CandidateRoute>
              <JobApplicationPage />
            </CandidateRoute>
          }
        />
        <Route
          path="jobs/new"
          element={
            <RecruiterRoute>
              <RecruiterJobFormPage />
            </RecruiterRoute>
          }
        />
        <Route
          path="jobs/:jobId/applicants"
          element={
            <RecruiterRoute>
              <RecruiterJobApplicantsPage />
            </RecruiterRoute>
          }
        />
        <Route
          path="jobs/:jobId"
          element={
            <RecruiterRoute>
              <RecruiterJobDetailPage />
            </RecruiterRoute>
          }
        />
        <Route
          path="recruiter"
          element={
            <RecruiterRoute>
              <RecruiterDashboardPage />
            </RecruiterRoute>
          }
        />\
        <Route
          path="recommended-jobs"
          element={
            <CandidateRoute>
              <RecommendedJobsPage />
            </CandidateRoute>
          }
        />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ResumeProvider>
          <AppRoutes />
        </ResumeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
