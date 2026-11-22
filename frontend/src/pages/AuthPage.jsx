import { useState } from 'react';
import SignInHero from '../components/auth/SignInHero';
import SignInForm from '../components/auth/SignInForm';
import '../styles/AuthPage.css';

export const AuthPage = () => {
  const [portalRole, setPortalRole] = useState('candidate');
  const isRecruiter = portalRole === 'recruiter';

  return (
    <div className="auth-page-root">
      <div className="auth-page-content">
        <SignInHero isRecruiter={isRecruiter} />
        <SignInForm
          portalRole={portalRole}
          onPortalRoleChange={setPortalRole}
        />
      </div>
    </div>
  );
};

export default AuthPage;
