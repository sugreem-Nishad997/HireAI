const RecommendationProgress = ({ run }) => {
    if (!run) return null;

    const {
        status,
        totalJobs = 0,
        processedJobs = 0,
        failedJobs = 0,
    } = run;

    const percentage = totalJobs
        ? Math.min(100, Math.round((processedJobs / totalJobs) * 100))
        : 0;

    const messages = {
        queued: 'Your job recommendations are waiting to be processed.',
        processing: 'AI is analyzing your resume against available jobs.',
        completed: 'Your job recommendations are ready.',
        partial: 'Some recommendations could not be generated.',
        failed: 'Recommendation generation failed. Please try again.',
    };

    return (
        <div className="recommendation-progress">
            <div className="recommendation-progress-header">
                <strong>Recommendation Status</strong>
                <span className={`status-badge ${status}`}>
                    {status}
                </span>
            </div>

            <p>{messages[status] || 'Checking recommendation status...'}</p>

            {(status === 'processing' || status === 'queued') && (
                <>
                    <div className="progress-track">
                        <div
                            className="progress-fill"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>

                    <small>
                        {processedJobs} of {totalJobs} jobs processed
                    </small>
                </>
            )}

            {failedJobs > 0 && (
                <small>{failedJobs} jobs could not be analyzed.</small>
            )}
        </div>
    );
};

export default RecommendationProgress;