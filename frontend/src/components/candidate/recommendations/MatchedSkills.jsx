const MatchedSkills = ({ skills = [] }) => {
    if (!skills.length) return null;

    return (
        <div className="recommendation-skills">
            <h4>Matched Skills</h4>

            <div className="skill-tags matched">
                {skills.map((skill, index) => (
                    <span key={`${skill}-${index}`}>{skill}</span>
                ))}
            </div>
        </div>
    );
};

export default MatchedSkills;