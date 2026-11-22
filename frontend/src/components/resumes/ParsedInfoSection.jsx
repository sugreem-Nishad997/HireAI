import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import CodeRoundedIcon from '@mui/icons-material/CodeRounded';
import '../../styles/ParsedInfoSection.css';

export const ParsedInfoSection = ({ resume }) => {
  if (!resume) return null;

  const personal = resume.personalInfo || {};
  const skills = resume.skills || [];
  const education = resume.education || [];
  const experience = resume.experience || [];
  const projects = resume.projects || [];

  return (
    <div className="parsed-info-grid">
      {/* Left Column */}
      <div className="parsed-info-col">
        {/* Personal Information Card */}
        <div className="parsed-card">
          <h3 className="parsed-card-title">Personal Information</h3>

          <div className="parsed-fields-list">
            {/* Full Name */}
            <div className="parsed-field-row">
              <div className="parsed-field-icon-circle">
                <PersonOutlineRoundedIcon sx={{ fontSize: 18 }} />
              </div>
              <div className="parsed-field-content">
                <span className="parsed-field-label">Full Name</span>
                <span className="parsed-field-value">
                  {personal.fullName || 'Not available'}
                </span>
              </div>
            </div>

            {/* Email */}
            <div className="parsed-field-row">
              <div className="parsed-field-icon-circle">
                <EmailOutlinedIcon sx={{ fontSize: 18 }} />
              </div>
              <div className="parsed-field-content">
                <span className="parsed-field-label">Email</span>
                <span className="parsed-field-value-regular">
                  {personal.email || 'Not available'}
                </span>
              </div>
            </div>

            {/* Phone */}
            <div className="parsed-field-row">
              <div className="parsed-field-icon-circle">
                <PhoneOutlinedIcon sx={{ fontSize: 18 }} />
              </div>
              <div className="parsed-field-content">
                <span className="parsed-field-label">Phone</span>
                <span className="parsed-field-value-regular">
                  {personal.phone || 'Not available'}
                </span>
              </div>
            </div>

            {/* Summary */}
            <div className="parsed-field-row">
              <div className="parsed-field-icon-circle">
                <DescriptionOutlinedIcon sx={{ fontSize: 18 }} />
              </div>
              <div className="parsed-field-content">
                <span className="parsed-field-label">Summary</span>
                <span className="parsed-field-value-summary">
                  {personal.summary || 'No summary available'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Skills Card */}
        <div className="parsed-card">
          <h3 className="parsed-card-title">Skills</h3>

          <div className="parsed-skills-wrap">
            {skills.map((skill, idx) => (
              <span key={idx} className="parsed-skill-pill">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="parsed-info-col">
        {/* Education Card */}
        <div className="parsed-card">
          <div className="parsed-card-header-with-icon">
            <SchoolOutlinedIcon sx={{ fontSize: 19, color: '#2563EB' }} />
            <h3>Education</h3>
          </div>

          {education.length > 0 ? (
            education.map((edu, idx) => (
              <div key={idx} className="parsed-edu-item">
                <span className="parsed-edu-degree">{edu.degree}</span>
                <span className="parsed-edu-institution">{edu.institution}</span>
                <span className="parsed-edu-year">{edu.graduationYear}</span>
              </div>
            ))
          ) : (
            <span className="parsed-empty-text">No education details found.</span>
          )}
        </div>

        {/* Experience Card */}
        <div className="parsed-card">
          <div className="parsed-card-header-with-icon">
            <WorkOutlineRoundedIcon sx={{ fontSize: 19, color: '#2563EB' }} />
            <h3>Experience</h3>
          </div>

          {experience.length > 0 ? (
            experience.map((exp, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="parsed-edu-degree">
                  {exp.jobTitle} - {exp.company}
                </span>
                <span className="parsed-edu-institution">{exp.period}</span>
                <p style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
                  {exp.description}
                </p>
              </div>
            ))
          ) : (
            <span className="parsed-empty-text">No experience details found.</span>
          )}
        </div>

        {/* Projects Card */}
        <div className="parsed-card">
          <div className="parsed-card-header-with-icon">
            <CodeRoundedIcon sx={{ fontSize: 19, color: '#2563EB' }} />
            <h3>Projects</h3>
          </div>

          {projects.length > 0 ? (
            projects.map((proj, idx) => (
              <div key={idx} className="parsed-project-item">
                <span className="parsed-project-title">{proj.name}</span>
                <p className="parsed-project-desc">{proj.description}</p>

                {proj.technologies && (
                  <div className="parsed-tech-pills">
                    {proj.technologies.map((tech, tIdx) => (
                      <span key={tIdx} className="parsed-tech-pill">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <span className="parsed-empty-text">No project details found.</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParsedInfoSection;
