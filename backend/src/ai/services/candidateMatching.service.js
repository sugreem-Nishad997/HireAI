import groq from "../config/groq.js";
import { candidateMatchingPrompt } from "../prompts/candidateParser.prompt.js";


export const matchCandidateToJob = async (candidate, job) => {
    
  const response = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",

    temperature: 0,

    response_format: { type: "json_object" },

    messages: [
      {
        role: "system",
        content: candidateMatchingPrompt,

      },
      {
        role: "user",
        content: JSON.stringify({
          job: {
            title: job.title,
            description: job.description,
            requiredSkills: job.requiredSkills,
            preferredSkills: job.preferredSkills,
            minimumExperienceYears: job.minimumExperienceYears,
          },
          candidate: {
            skills: candidate.skills,
            education: candidate.education,
            experience: candidate.experience,
            projects: candidate.projects,
            summary: candidate.summary,
          },
        }),
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  


  if (!content) {
    throw new Error("AI returned an empty matching result.");
  }

  const result = JSON.parse(content);

  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new Error("AI returned an invalid matching result: expected a JSON object.");
  }

  const invalidFields = [];
  const isStringArray = (value) =>
    Array.isArray(value) && value.every((item) => typeof item === "string");

  if (
    typeof result.matchScore !== "number" ||
    !Number.isFinite(result.matchScore) ||
    result.matchScore < 0 ||
    result.matchScore > 100
  ) {
    invalidFields.push("matchScore");
  }
  if (!isStringArray(result.matchedSkills)) {
    invalidFields.push("matchedSkills");
  }
  if (!isStringArray(result.missingRequiredSkills)) {
    invalidFields.push("missingRequiredSkills");
  }
  if (!isStringArray(result.relevantEvidence)) {
    invalidFields.push("relevantEvidence");
  }
  if (!isStringArray(result.limitations)) {
    invalidFields.push("limitations");
  }
  if (typeof result.summary !== "string") {
    invalidFields.push("summary");
  }

  const assessment = result.experienceAssessment;
  if (
    !assessment ||
    typeof assessment !== "object" ||
    Array.isArray(assessment)
  ) {
    invalidFields.push("experienceAssessment");
  } else {
    if (
      assessment.professionalExperienceYears !== null &&
      (typeof assessment.professionalExperienceYears !== "number" ||
        !Number.isFinite(assessment.professionalExperienceYears) ||
        assessment.professionalExperienceYears < 0)
    ) {
      invalidFields.push("experienceAssessment.professionalExperienceYears");
    }
    if (!Array.isArray(assessment.projectExperience)) {
      invalidFields.push("experienceAssessment.projectExperience");
    }
    if (typeof assessment.assessment !== "string") {
      invalidFields.push("experienceAssessment.assessment");
    }
  }

  if (invalidFields.length > 0) {
    throw new Error(
      `AI returned an invalid matching result; invalid fields: ${invalidFields.join(", ")}.`
    );
  }

  return result;
};
