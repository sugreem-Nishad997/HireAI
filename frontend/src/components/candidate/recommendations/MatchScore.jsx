const MatchScore = ({ score = 0 }) => {
    const safeScore = Math.min(100, Math.max(0, Number(score) || 0));

    const getLabel = () => {
        if (safeScore >= 80) return 'Excellent Match';
        if (safeScore >= 65) return 'Good Match';
        if (safeScore >= 45) return 'Moderate Match';
        return 'Low Match';
    };

    return (
        <div className="match-score">
            <div
                className="match-score-circle"
                style={{ '--match-score': `${safeScore}%` }}
            >
                <span>{safeScore}%</span>
            </div>

            <div className="match-score-info">
                <strong>{getLabel()}</strong>
                <small>Resume-to-job relevance</small>
            </div>
        </div>
    );
};

export default MatchScore;