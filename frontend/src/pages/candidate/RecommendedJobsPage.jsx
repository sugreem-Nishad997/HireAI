import RecommendedJobsSection from '../../components/candidate/recommendations/RecommendedJobsSection';
import '../../styles/Recommendations.css';

const RecommendedJobsPage = () => {
  return (
    <div className="recommendations-page animate-fade-in">
      <RecommendedJobsSection />
    </div>
  );
};

export default RecommendedJobsPage;
