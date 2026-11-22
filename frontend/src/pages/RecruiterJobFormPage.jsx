import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import FeedbackAlert from '../components/common/FeedbackAlert';
import { jobApi } from '../api/client';
import '../styles/RecruiterJobsPage.css';

export const RecruiterJobFormPage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [preferredSkills, setPreferredSkills] = useState('');
  const [minimumExperienceYears, setMinimumExperienceYears] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await jobApi.create({
        title: title.trim(),
        description: description.trim(),
        requiredSkills: requiredSkills.split(',').map((skill) => skill.trim()).filter(Boolean),
        preferredSkills: preferredSkills.split(',').map((skill) => skill.trim()).filter(Boolean),
        minimumExperienceYears: Number(minimumExperienceYears),
      });
      navigate('/jobs');
    } catch (createError) {
      setError(
        createError.response?.data?.message
          || createError.message
          || 'Unable to create job.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="recruiter-jobs-page animate-fade-in">
      <button
        type="button"
        className="recruiter-jobs-back-button"
        onClick={() => navigate('/jobs')}
      >
        <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
        Back to Jobs
      </button>

      <header className="recruiter-jobs-header recruiter-job-form-header">
        <div>
          <h1>Add a Job</h1>
          <p>Share the role details to start matching candidates.</p>
        </div>
      </header>

      <form className="recruiter-job-form" onSubmit={handleSubmit}>
        <label>
          Job title
          <input
            type="text"
            required
            maxLength={160}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Senior Frontend Engineer"
          />
        </label>

        <label>
          Job description
          <textarea
            required
            rows={7}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe the role and responsibilities"
          />
        </label>

        <label>
          Required skills
          <input
            type="text"
            value={requiredSkills}
            onChange={(event) => setRequiredSkills(event.target.value)}
            placeholder="React, JavaScript, CSS"
          />
          <span>Separate skills with commas.</span>
        </label>

        <label>
          Preferred skills
          <input
            type="text"
            value={preferredSkills}
            onChange={(event) => setPreferredSkills(event.target.value)}
            placeholder="TypeScript, Node.js"
          />
          <span>Separate skills with commas.</span>
        </label>

        <label>
          Minimum experience (years)
          <input
            type="number"
            min="0"
            step="0.5"
            required
            value={minimumExperienceYears}
            onChange={(event) => setMinimumExperienceYears(event.target.value)}
          />
        </label>

        {error && <FeedbackAlert severity="error">{error}</FeedbackAlert>}

        <button
          type="submit"
          className="recruiter-jobs-add-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating job...' : 'Create Job'}
        </button>
      </form>
    </div>
  );
};

export default RecruiterJobFormPage;
