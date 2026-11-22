import { useEffect, useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate } from 'react-router-dom';
import { profileApi } from '../api/client';
import FeedbackAlert from '../components/common/FeedbackAlert';
import LoadingIndicator from '../components/common/LoadingIndicator';
import { useAuth } from '../context/AuthContext';
import '../styles/SettingsPage.css';

const errorMessage = (error) =>
  error.response?.data?.message || error.message || 'Unable to save your changes.';

const profileLists = [
  {
    key: 'education',
    title: 'Education',
    fields: [
      {key: 'degree', label: 'Degree'},
      {key: 'institution', label: 'Institution'},
      {key: 'fieldOfStudy', label: 'Field of Study'},
      {key: 'graduationYear', label: 'Graduation Year'},
    ],
  },
  {
    key: 'experience',
    title: 'Experience',
    fields: [
      {key: 'jobTitle', label: 'Job Title'},
      {key: 'company', label: 'Company'},
      {key: 'startDate', label: 'Start Date'},
      {key: 'endDate', label: 'End Date'},
      {key: 'description', label: 'Description', multiline: true},
    ],
  },
  {
    key: 'projects',
    title: 'Projects',
    fields: [
      {key: 'name', label: 'Project Name'},
      {key: 'description', label: 'Description', multiline: true},
      {key: 'technologies', label: 'Technologies', commaSeparated: true},
    ],
  },
];

const ProfileListEditor = ({definition, items, onChange}) => {
  const createItem = () => Object.fromEntries(
    definition.fields.map(({key, commaSeparated}) => [key, commaSeparated ? [] : '']),
  );

  return (
    <section className="settings-list-editor">
      <div className="settings-list-heading">
        <h3 className="settings-label">{definition.title}</h3>
        <button type="button" className="settings-add-btn" onClick={() => onChange([...items, createItem()])}>
          Add {definition.title.toLowerCase()}
        </button>
      </div>
      {items.map((item, index) => (
        <div className="settings-list-item" key={`${definition.key}-${index}`}>
          <div className="settings-list-fields">
            {definition.fields.map(({key, label, multiline, commaSeparated}) => (
              <div key={key}>
                <label className="settings-label" htmlFor={`${definition.key}-${index}-${key}`}>
                  {label}
                </label>
                {multiline ? (
                  <textarea
                    id={`${definition.key}-${index}-${key}`}
                    value={item[key] || ''}
                    onChange={(event) => {
                      const nextItems = [...items];
                      nextItems[index] = {...item, [key]: event.target.value};
                      onChange(nextItems);
                    }}
                    className="settings-textarea"
                    rows={3}
                  />
                ) : (
                  <input
                    id={`${definition.key}-${index}-${key}`}
                    type="text"
                    value={commaSeparated ? (item[key] || []).join(', ') : item[key] || ''}
                    onChange={(event) => {
                      const value = commaSeparated
                        ? event.target.value.split(',').map((entry) => entry.trim()).filter(Boolean)
                        : event.target.value;
                      const nextItems = [...items];
                      nextItems[index] = {...item, [key]: value};
                      onChange(nextItems);
                    }}
                    className="settings-input"
                  />
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            className="settings-remove-btn"
            onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
          >
            Remove
          </button>
        </div>
      ))}
    </section>
  );
};

export const SettingsPage = () => {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const isCandidate = user?.role === 'candidate';
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    profileName: '',
    profileEmail: '',
    phone: '',
    location: '',
    summary: '',
    skills: '',
    education: [],
    experience: [],
    projects: [],
  });
  const [loading, setLoading] = useState(isCandidate);
  const [saving, setSaving] = useState(false);
  const [deletingProfile, setDeletingProfile] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [accountPassword, setAccountPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isCandidate) {
      return undefined;
    }

    let active = true;
    profileApi.getMine()
      .then(({ data }) => {
        if (!active || !data.data) return;
        const profile = data.data;
        setForm((current) => ({
          ...current,
          profileName: profile.fullName || '',
          profileEmail: profile.email || '',
          phone: profile.phone || '',
          location: profile.location || '',
          summary: profile.summary || '',
          skills: (profile.skills || []).join(', '),
          education: profile.education || [],
          experience: profile.experience || [],
          projects: profile.projects || [],
        }));
      })
      .catch((fetchError) => {
        if (active) setError(errorMessage(fetchError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isCandidate, user?.email, user?.id, user?.name]);

  const updateField = (field) => (event) => {
    setForm((current) => ({...current, [field]: event.target.value}));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const {data: accountResult} = await profileApi.updateAccount({
        name: form.name,
        email: form.email,
      });
      setUser({
        ...user,
        name: accountResult.data.name,
        email: accountResult.data.email,
      });

      if (isCandidate) {
        await profileApi.update({
          fullName: form.profileName,
          email: form.profileEmail,
          phone: form.phone,
          location: form.location,
          summary: form.summary,
          skills: form.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
          education: form.education,
          experience: form.experience,
          projects: form.projects,
        });
      }

      setMessage('Profile updated successfully.');
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!window.confirm('Delete your candidate profile? This will not delete your account or resumes.')) {
      return;
    }

    setDeletingProfile(true);
    setError('');
    setMessage('');
    try {
      await profileApi.delete();
      setForm((current) => ({
        ...current,
        profileName: '',
        profileEmail: '',
        phone: '',
        location: '',
        summary: '',
        skills: '',
        education: [],
        experience: [],
        projects: [],
      }));
      setMessage('Candidate profile deleted. Your account and resumes are unchanged.');
    } catch (deleteError) {
      setError(errorMessage(deleteError));
    } finally {
      setDeletingProfile(false);
    }
  };

  const handleDeleteAccount = async (event) => {
    event.preventDefault();
    if (!accountPassword) {
      setError('Enter your password to delete your account.');
      return;
    }
    if (!window.confirm('Permanently delete your account and associated data? This cannot be undone.')) {
      return;
    }

    setDeletingAccount(true);
    setError('');
    try {
      await profileApi.deleteAccount(accountPassword);
      logout();
      navigate('/login', {replace: true});
    } catch (deleteError) {
      setError(errorMessage(deleteError));
      setDeletingAccount(false);
    }
  };

  return (
    <div className="animate-fade-in settings-container">
      <div className="settings-header">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-subtitle">Update your profile or manage your account.</p>
      </div>

      {error && <FeedbackAlert severity="error">{error}</FeedbackAlert>}
      {message && <FeedbackAlert severity="success">{message}</FeedbackAlert>}
      {loading ? (
        <LoadingIndicator label="Loading your profile" />
      ) : (
        <>
          <section className="settings-card">
            <h2 className="settings-section-title">Update profile</h2>
            <form
              onSubmit={handleSave}
              className={`settings-form ${isCandidate ? 'settings-profile-form' : ''}`}
            >
              <div>
                <label htmlFor="settings-name" className="settings-label">Account Name</label>
                <input
                  id="settings-name"
                  type="text"
                  value={form.name}
                  onChange={updateField('name')}
                  className="settings-input"
                  required
                />
              </div>

              <div>
                <label htmlFor="settings-email" className="settings-label">Account Email</label>
                <input
                  id="settings-email"
                  type="email"
                  value={form.email}
                  onChange={updateField('email')}
                  className="settings-input"
                  required
                />
              </div>

              {isCandidate && (
                <>
                  <div>
                    <label htmlFor="settings-profile-name" className="settings-label">Profile Name</label>
                    <input
                      id="settings-profile-name"
                      type="text"
                      value={form.profileName}
                      onChange={updateField('profileName')}
                      className="settings-input"
                    />
                  </div>
                  <div>
                    <label htmlFor="settings-profile-email" className="settings-label">Profile Contact Email</label>
                    <input
                      id="settings-profile-email"
                      type="email"
                      value={form.profileEmail}
                      onChange={updateField('profileEmail')}
                      className="settings-input"
                    />
                  </div>
                  <div>
                    <label htmlFor="settings-phone" className="settings-label">Phone</label>
                    <input
                      id="settings-phone"
                      type="tel"
                      value={form.phone}
                      onChange={updateField('phone')}
                      className="settings-input"
                    />
                  </div>
                  <div>
                    <label htmlFor="settings-location" className="settings-label">Location</label>
                    <input
                      id="settings-location"
                      type="text"
                      value={form.location}
                      onChange={updateField('location')}
                      className="settings-input"
                    />
                  </div>
                  <div>
                    <label htmlFor="settings-summary" className="settings-label">Professional Summary</label>
                    <textarea
                      id="settings-summary"
                      value={form.summary}
                      onChange={updateField('summary')}
                      className="settings-textarea"
                      rows={5}
                    />
                  </div>
                  <div>
                    <label htmlFor="settings-skills" className="settings-label">Skills</label>
                    <input
                      id="settings-skills"
                      type="text"
                      value={form.skills}
                      onChange={updateField('skills')}
                      className="settings-input"
                      placeholder="Separate skills with commas"
                    />
                  </div>
                  {profileLists.map((definition) => (
                    <ProfileListEditor
                      key={definition.key}
                      definition={definition}
                      items={form[definition.key]}
                      onChange={(items) => setForm((current) => ({
                        ...current,
                        [definition.key]: items,
                      }))}
                    />
                  ))}
                </>
              )}

              <div className="settings-actions-row">
                <button type="submit" className="settings-submit-btn" disabled={saving}>
                  {saving && <CircularProgress size={16} color="inherit" />}
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </section>

          {isCandidate && (
            <section className="settings-card settings-danger-card">
              <h2 className="settings-section-title">Delete profile</h2>
              <p>Deletes your candidate profile details. Your account, resumes, and applications remain.</p>
              <button
                type="button"
                className="settings-danger-btn"
                onClick={handleDeleteProfile}
                disabled={deletingProfile}
              >
                {deletingProfile && <CircularProgress size={16} color="inherit" />}
                {deletingProfile ? 'Deleting...' : 'Delete Candidate Profile'}
              </button>
            </section>
          )}

          <section className="settings-card settings-danger-card">
            <h2 className="settings-section-title">Delete account</h2>
            <p>This permanently deletes your account and associated profile, resumes, jobs, and application data.</p>
            <form onSubmit={handleDeleteAccount} className="settings-form">
              <div>
                <label htmlFor="delete-account-password" className="settings-label">
                  Confirm with your password
                </label>
                <input
                  id="delete-account-password"
                  type="password"
                  value={accountPassword}
                  onChange={(event) => setAccountPassword(event.target.value)}
                  className="settings-input"
                  autoComplete="current-password"
                  required
                />
              </div>
              <button type="submit" className="settings-danger-btn" disabled={deletingAccount}>
                {deletingAccount && <CircularProgress size={16} color="inherit" />}
                {deletingAccount ? 'Deleting Account...' : 'Permanently Delete Account'}
              </button>
            </form>
          </section>
        </>
      )}
    </div>
  );
};

export default SettingsPage;
