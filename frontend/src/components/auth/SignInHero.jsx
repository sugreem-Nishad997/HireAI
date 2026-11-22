import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import PsychologyRoundedIcon from '@mui/icons-material/PsychologyRounded';
import CodeRoundedIcon from '@mui/icons-material/CodeRounded';
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import '../../styles/SignInHero.css';

export const SignInHero = ({ isRecruiter = false }) => {
  return (
    <div className="signin-hero-container">
      {/* Brand Header */}
      <div className="signin-hero-brand">
        <div className="signin-hero-logo">
          <AutoAwesomeRoundedIcon sx={{ fontSize: 18 }} />
        </div>
        <span className="signin-hero-brand-name">HireAI</span>
      </div>

      {/* Main Copy */}
      <div className="signin-hero-text-block">
        <h1 className="signin-hero-headline">
          {isRecruiter
            ? 'Find the Perfect Candidate with AI'
            : 'Turn Resumes into Opportunities'}
        </h1>
        <p className="signin-hero-subtext">
          {isRecruiter
            ? 'Discover qualified candidates faster with AI-powered resume matching.'
            : 'Upload your resume, get it parsed with AI, and take the next step in your career.'}
        </p>
      </div>

      {/* Portal-specific illustration */}
      {isRecruiter ? (
        <div className="signin-hero-recruiter-graphic">
          <img
            src="/recruiter-hero.png"
            alt="Colorful layered abstract artwork"
          />
        </div>
      ) : (
        <div className="signin-hero-graphic-wrap">
          <div className="signin-hero-radial-glow" />

          {/* Realistic Styled Resume Card */}
          <div className="signin-hero-resume-card">
            <div className="signin-hero-card-header">
              <div className="signin-hero-avatar-box">
                <PersonRoundedIcon sx={{ fontSize: 24 }} />
              </div>
              <div className="signin-hero-lines-header">
                <div className="signin-hero-line-primary" />
                <div className="signin-hero-line-secondary" />
              </div>
            </div>

            <div className="signin-hero-lines-body">
              <div className="signin-hero-line-full" />
              <div className="signin-hero-line-90" />
              <div className="signin-hero-line-75" />
            </div>

            <div className="signin-hero-lines-footer">
              <div className="signin-hero-line-85" />
              <div className="signin-hero-line-60" />
            </div>
          </div>

          {/* Floating Upload Cloud Circle */}
          <div className="signin-hero-upload-cloud">
            <CloudUploadRoundedIcon sx={{ fontSize: 28 }} />
          </div>

          {/* Floating AI Badges */}
          <div className="signin-hero-badge badge-ai-parsing">
            <PsychologyRoundedIcon sx={{ fontSize: 16, color: '#6366F1' }} />
            <span>AI Parsing</span>
          </div>

          <div className="signin-hero-badge badge-skills">
            <CodeRoundedIcon sx={{ fontSize: 16, color: '#10B981' }} />
            <span>Skills</span>
          </div>

          <div className="signin-hero-badge badge-experience">
            <WorkOutlineRoundedIcon sx={{ fontSize: 16, color: '#059669' }} />
            <span>Experience</span>
          </div>

          <div className="signin-hero-badge badge-education">
            <SchoolOutlinedIcon sx={{ fontSize: 16, color: '#2563EB' }} />
            <span>Education</span>
          </div>
        </div>
      )}

      <div style={{ height: '24px' }} />
    </div>
  );
};

export default SignInHero;
