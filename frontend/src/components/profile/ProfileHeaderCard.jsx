import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import { useAuth } from '../../context/AuthContext';
import '../../styles/ProfileHeaderCard.css';

export const ProfileHeaderCard = ({ profile }) => {
  const { user } = useAuth();
  const parsedInfo = profile?.personalInfo || {};
  const name = parsedInfo.fullName || user?.name || '';
  const email = parsedInfo.email || user?.email || '';
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="profile-header-card">
      <div className="profile-header-row">
        {/* Large Avatar */}
        <div className="profile-avatar-large">
          {initials}
        </div>

        {/* Profile Info */}
        <div className="profile-info-block">
          <div className="profile-name-badge-row">
            <h1 className="profile-user-name">
              {name}
            </h1>
          </div>

          <div className="profile-contacts-row">
            {email && (
              <div className="profile-contact-item">
                <EmailOutlinedIcon sx={{ fontSize: 16 }} />
                <span>{email}</span>
              </div>
            )}

            {parsedInfo.phone && (
              <div className="profile-contact-item">
                <PhoneOutlinedIcon sx={{ fontSize: 16 }} />
                <span>{parsedInfo.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeaderCard;
