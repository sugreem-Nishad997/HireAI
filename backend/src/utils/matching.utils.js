
import crypto from "crypto";

export const generateMatchInputHash = (candidate, job) => {
    const matchingInput = {
        candidate: {
            skills: candidate.skills ?? [],
            education: candidate.education ?? [],
            experience: candidate.experience ?? [],
            projects: candidate.projects ?? [],
            summary: candidate.summary ?? "",
        },

        job: {
            title: job.title ?? "",
            description: job.description ?? "",
            requiredSkills: job.requiredSkills ?? [],
            preferredSkills: job.preferredSkills ?? [],
            minimumExperienceYears: job.minimumExperienceYears ?? 0,
        },
    };

    return crypto
        .createHash("sha256")
        .update(JSON.stringify(matchingInput))
        .digest("hex");
};
