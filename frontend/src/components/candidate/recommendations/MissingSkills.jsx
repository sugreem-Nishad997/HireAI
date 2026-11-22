const MissingSkills = ({ skills = [] }) => {
    if (!skills.length) return null;

    return (
        <div className="recommendation-skills">
            <h4>Skills to Improve</h4>

            <div className="skill-tags missing">
                {skills.map((skill, index) => (
                    <span key={`${skill}-${index}`}>{skill}</span>
                ))}
            </div>
        </div>
    );
};

export default MissingSkills