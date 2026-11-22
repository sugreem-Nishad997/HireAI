import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import CodeRoundedIcon from '@mui/icons-material/CodeRounded';
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import '../../styles/ProfileOverview.css';

export const ProfileOverview = ({ resume, activeTab = 'overview' }) => {
  const parsedData = resume?.personalInfo || {};
  const skills = resume?.skills || [];
  const education = resume?.education || [];
  const experience = resume?.experience || [];
  const projects = resume?.projects || [];

  return (
    <div className="profile-overview-grid">
      {/* Left Column */}
      <div className="profile-overview-col">
        {/* About Me Card */}
        {activeTab === 'overview' && parsedData.summary && (
          <div className="profile-overview-card">
            <h3 className="profile-overview-card-title">About Me</h3>
            <p className="profile-overview-summary">
              {parsedData.summary}
            </p>
          </div>
        )}

        {/* Skills Card */}
        {(activeTab === 'overview' || activeTab === 'skills') && skills.length > 0 && (
          <div className="profile-overview-card">
            <h3 className="profile-overview-card-title">Skills</h3>

            <div className="profile-overview-skills-wrap">
              {skills.map((skill, idx) => (
                <span key={idx} className="profile-overview-skill-pill">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Experience if Tab is experience */}
        {(activeTab === 'overview' || activeTab === 'experience') && experience.length > 0 && (
          <div className="profile-overview-card">
            <div className="profile-overview-card-header-icon">
              <WorkOutlineRoundedIcon sx={{ fontSize: 19, color: '#2563EB' }} />
              <h3>Experience</h3>
            </div>
            {experience.map((item, idx) => (
              <div key={idx} className="profile-overview-edu-item">
                <span className="profile-overview-edu-degree">
                  {[item.jobTitle, item.company].filter(Boolean).join(' - ')}
                </span>
                {(item.period || item.description) && (
                  <span className="profile-overview-edu-inst">
                    {[item.period, item.description].filter(Boolean).join(' · ')}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Column */}
      <div className="profile-overview-col">
        {/* Education Card */}
        {(activeTab === 'overview' || activeTab === 'education') && education.length > 0 && (
          <div className="profile-overview-card">
            <div className="profile-overview-card-header-icon">
              <SchoolOutlinedIcon sx={{ fontSize: 19, color: '#2563EB' }} />
              <h3>Education</h3>
            </div>

            {education.map((edu, idx) => (
              <div key={idx} className="profile-overview-edu-item">
                <span className="profile-overview-edu-degree">{edu.degree}</span>
                {edu.institution && (
                  <span className="profile-overview-edu-inst">{edu.institution}</span>
                )}
                {(edu.fieldOfStudy || edu.graduationYear) && (
                  <span className="profile-overview-edu-year">
                    {[edu.fieldOfStudy, edu.graduationYear].filter(Boolean).join(' · ')}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Projects Card */}
        {(activeTab === 'overview' || activeTab === 'projects') && projects.length > 0 && (
          <div className="profile-overview-card">
            <div className="profile-overview-card-header-icon">
              <CodeRoundedIcon sx={{ fontSize: 19, color: '#2563EB' }} />
              <h3>Projects</h3>
            </div>

            {projects.map((proj, idx) => (
              <div key={idx} className="profile-overview-project-item">
                <span className="profile-overview-project-name">{proj.name}</span>
                <p className="profile-overview-project-desc">{proj.description}</p>

                {proj.technologies && (
                  <div className="profile-overview-project-techs">
                    {proj.technologies.map((tech, tIdx) => (
                      <span key={tIdx} className="profile-overview-project-pill">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileOverview;
