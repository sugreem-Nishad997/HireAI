import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import CircularProgress from '@mui/material/CircularProgress';
import FeedbackAlert from '../common/FeedbackAlert';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/client';
import '../../styles/SignInForm.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const SignInForm = ({
  portalRole = 'candidate',
  onPortalRoleChange = () => {},
}) => {
  // mode: 'signin' | 'signup' | 'forgot-password'
  const [mode, setMode] = useState('signin');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // OTP and Password Reset States
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const resetFormState = (nextMode) => {
    setMode(nextMode);
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setOtpSent(false);
    setResendCooldown(0);
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Handle Sign In submission
  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const user = await login(email, password, rememberMe);
      navigate(user.role === 'recruiter' ? '/recruiter' : '/dashboard');
    } catch (error) {
      setErrorMessage(error.message || 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Requesting Registration OTP
  const handleSendRegistrationOtp = async () => {
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsSendingOtp(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await authApi.sendRegistrationOtp(email.trim());
      setOtpSent(true);
      setResendCooldown(60);
      setSuccessMessage(
        response.data?.message || `Verification code sent to ${email.trim()}`
      );
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          'Failed to send verification code. Please check your email and try again.'
      );
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle Submitting Registration with OTP
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();

    if (!otpSent) {
      await handleSendRegistrationOtp();
      return;
    }

    if (!otp.trim() || otp.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await register(fullName.trim(), email.trim(), password, portalRole, otp.trim());
      navigate(portalRole === 'recruiter' ? '/recruiter' : '/dashboard');
    } catch (error) {
      setErrorMessage(
        error.message || 'Registration failed. Please check the verification code.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Requesting Forgot Password OTP
  const handleSendForgotPasswordOtp = async (e) => {
    if (e) e.preventDefault();

    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSendingOtp(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await authApi.sendForgotPasswordOtp(email.trim());
      setOtpSent(true);
      setResendCooldown(60);
      setSuccessMessage(
        response.data?.message || `Password reset code sent to ${email.trim()}`
      );
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          'Failed to send reset code. Please check your email address.'
      );
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle Submitting New Password with OTP
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();

    if (!otp.trim() || otp.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit reset code sent to your email.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await authApi.resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });

      // Reset to sign in mode with success message
      setMode('signin');
      setPassword('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setOtpSent(false);
      setSuccessMessage(
        response.data?.message ||
          'Password reset successfully! You can now sign in with your new password.'
      );
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          'Failed to reset password. Please check the code and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signin-form-container">
      <div className="signin-form-card">
        {/* Portal selector only visible for sign in and sign up */}
        {mode !== 'forgot-password' && (
          <div className="auth-portal-selector" aria-label="Choose your portal">
            <button
              type="button"
              className={`auth-portal-option ${portalRole === 'recruiter' ? 'active' : ''}`}
              aria-pressed={portalRole === 'recruiter'}
              onClick={() => onPortalRoleChange('recruiter')}
            >
              HR Portal
            </button>
            <button
              type="button"
              className={`auth-portal-option ${portalRole === 'candidate' ? 'active' : ''}`}
              aria-pressed={portalRole === 'candidate'}
              onClick={() => onPortalRoleChange('candidate')}
            >
              Job Seeker
            </button>
          </div>
        )}

        {/* Header Titles */}
        {mode === 'signin' && (
          <>
            <h2 className="signin-form-title">Welcome Back</h2>
            <p className="signin-form-subtitle">Sign in to your account</p>
          </>
        )}

        {mode === 'signup' && (
          <>
            <h2 className="signin-form-title">Create an Account</h2>
            <p className="signin-form-subtitle">
              {otpSent
                ? 'Verify your email to complete registration'
                : 'Sign up to get started with HireAI'}
            </p>
          </>
        )}

        {mode === 'forgot-password' && (
          <>
            <div className="signin-back-header">
              <button
                type="button"
                className="signin-back-btn"
                onClick={() => resetFormState('signin')}
              >
                <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
                <span>Back to Sign In</span>
              </button>
            </div>
            <h2 className="signin-form-title">
              {otpSent ? 'Reset Your Password' : 'Forgot Password'}
            </h2>
            <p className="signin-form-subtitle">
              {otpSent
                ? 'Enter the 6-digit code sent to your email and your new password'
                : 'Enter your registered email address to receive a verification code'}
            </p>
          </>
        )}

        {/* Alerts */}
        {errorMessage && (
          <FeedbackAlert severity="error" onClose={() => setErrorMessage('')}>
            {errorMessage}
          </FeedbackAlert>
        )}

        {successMessage && (
          <FeedbackAlert severity="success" onClose={() => setSuccessMessage('')}>
            {successMessage}
          </FeedbackAlert>
        )}

        {/* 1. SIGN IN FORM */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="signin-form-fields">
            <div>
              <label className="signin-form-label" htmlFor="signin-email">
                Email Address
              </label>
              <input
                id="signin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="signin-form-input"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="signin-form-label" htmlFor="signin-password">
                Password
              </label>
              <div className="signin-password-wrapper">
                <input
                  id="signin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="signin-password-input"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="signin-eye-button"
                >
                  {showPassword ? (
                    <VisibilityOffOutlinedIcon sx={{ fontSize: 19 }} />
                  ) : (
                    <VisibilityOutlinedIcon sx={{ fontSize: 19 }} />
                  )}
                </button>
              </div>
            </div>

            <div className="signin-form-options-row">
              <label className="signin-remember-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="signin-checkbox"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => resetFormState('forgot-password')}
                className="signin-forgot-link-btn"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="signin-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting && <CircularProgress size={18} color="inherit" />}
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>

            <div className="signin-form-toggle-row">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => resetFormState('signup')}
                className="signin-toggle-btn"
              >
                Sign up
              </button>
            </div>
          </form>
        )}

        {/* 2. SIGN UP FORM WITH EMAIL OTP VERIFICATION */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUpSubmit} className="signin-form-fields">
            <div>
              <label className="signin-form-label" htmlFor="signup-name">
                Full Name
              </label>
              <input
                id="signup-name"
                type="text"
                required
                disabled={otpSent}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Rahul Sharma"
                className="signin-form-input"
              />
            </div>

            <div>
              <div className="signin-label-with-action">
                <label className="signin-form-label" htmlFor="signup-email">
                  Email Address
                </label>
                {otpSent && (
                  <button
                    type="button"
                    className="signin-change-link"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                      setSuccessMessage('');
                    }}
                  >
                    Change email
                  </button>
                )}
              </div>
              <input
                id="signup-email"
                type="email"
                required
                disabled={otpSent}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="signin-form-input"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="signin-form-label" htmlFor="signup-password">
                Password
              </label>
              <div className="signin-password-wrapper">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={otpSent}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="signin-password-input"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="signin-eye-button"
                  disabled={otpSent}
                >
                  {showPassword ? (
                    <VisibilityOffOutlinedIcon sx={{ fontSize: 19 }} />
                  ) : (
                    <VisibilityOutlinedIcon sx={{ fontSize: 19 }} />
                  )}
                </button>
              </div>
            </div>

            {/* OTP Verification Input when OTP has been sent */}
            {otpSent && (
              <div className="signin-otp-group">
                <div className="signin-label-with-action">
                  <label className="signin-form-label" htmlFor="signup-otp">
                    Verification Code
                  </label>
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isSendingOtp}
                    onClick={handleSendRegistrationOtp}
                    className="signin-resend-btn"
                  >
                    {isSendingOtp
                      ? 'Sending…'
                      : resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : 'Resend Code'}
                  </button>
                </div>
                <input
                  id="signup-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="signin-otp-input"
                />
                <span className="signin-otp-hint">
                  <MarkEmailReadOutlinedIcon sx={{ fontSize: 15 }} />
                  Enter the 6-digit code sent to your inbox.
                </span>
              </div>
            )}

            {!otpSent ? (
              <button
                type="button"
                onClick={handleSendRegistrationOtp}
                className="signin-submit-btn"
                disabled={isSendingOtp}
              >
                {isSendingOtp && <CircularProgress size={18} color="inherit" />}
                {isSendingOtp ? 'Sending verification code…' : 'Send Verification Code'}
              </button>
            ) : (
              <button
                type="submit"
                className="signin-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting && <CircularProgress size={18} color="inherit" />}
                {isSubmitting ? 'Verifying & Creating…' : 'Verify & Create Account'}
              </button>
            )}

            <div className="signin-form-toggle-row">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => resetFormState('signin')}
                className="signin-toggle-btn"
              >
                Sign in
              </button>
            </div>
          </form>
        )}

        {/* 3. FORGOT PASSWORD FLOW */}
        {mode === 'forgot-password' && (
          <form
            onSubmit={otpSent ? handleResetPasswordSubmit : handleSendForgotPasswordOtp}
            className="signin-form-fields"
          >
            <div>
              <div className="signin-label-with-action">
                <label className="signin-form-label" htmlFor="forgot-email">
                  Registered Email Address
                </label>
                {otpSent && (
                  <button
                    type="button"
                    className="signin-change-link"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                      setSuccessMessage('');
                    }}
                  >
                    Change email
                  </button>
                )}
              </div>
              <input
                id="forgot-email"
                type="email"
                required
                disabled={otpSent}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="signin-form-input"
                autoComplete="email"
              />
            </div>

            {otpSent && (
              <>
                <div className="signin-otp-group">
                  <div className="signin-label-with-action">
                    <label className="signin-form-label" htmlFor="reset-otp">
                      Reset Code
                    </label>
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || isSendingOtp}
                      onClick={handleSendForgotPasswordOtp}
                      className="signin-resend-btn"
                    >
                      {isSendingOtp
                        ? 'Sending…'
                        : resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : 'Resend Code'}
                    </button>
                  </div>
                  <input
                    id="reset-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    autoFocus
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="signin-otp-input"
                  />
                  <span className="signin-otp-hint">
                    <MarkEmailReadOutlinedIcon sx={{ fontSize: 15 }} />
                    Enter the 6-digit code sent to your inbox.
                  </span>
                </div>

                <div>
                  <label className="signin-form-label" htmlFor="reset-new-password">
                    New Password
                  </label>
                  <div className="signin-password-wrapper">
                    <input
                      id="reset-new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="signin-password-input"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="signin-eye-button"
                    >
                      {showNewPassword ? (
                        <VisibilityOffOutlinedIcon sx={{ fontSize: 19 }} />
                      ) : (
                        <VisibilityOutlinedIcon sx={{ fontSize: 19 }} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="signin-form-label" htmlFor="reset-confirm-password">
                    Confirm New Password
                  </label>
                  <div className="signin-password-wrapper">
                    <input
                      id="reset-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      className="signin-password-input"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="signin-eye-button"
                    >
                      {showConfirmPassword ? (
                        <VisibilityOffOutlinedIcon sx={{ fontSize: 19 }} />
                      ) : (
                        <VisibilityOutlinedIcon sx={{ fontSize: 19 }} />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            {!otpSent ? (
              <button
                type="submit"
                className="signin-submit-btn"
                disabled={isSendingOtp}
              >
                {isSendingOtp && <CircularProgress size={18} color="inherit" />}
                {isSendingOtp ? 'Sending reset code…' : 'Send Reset Code'}
              </button>
            ) : (
              <button
                type="submit"
                className="signin-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting && <CircularProgress size={18} color="inherit" />}
                {isSubmitting ? 'Resetting password…' : 'Reset Password'}
              </button>
            )}

            <div className="signin-form-toggle-row">
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => resetFormState('signin')}
                className="signin-toggle-btn"
              >
                Sign in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SignInForm;
