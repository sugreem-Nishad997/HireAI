
import mongoose from "mongoose";
import { Schema } from "mongoose";

const matchResultSchema = new Schema(
    {
        candidate: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        job: {
            type: Schema.Types.ObjectId,
            ref: "Job",
            required: true,
            index: true,
        },

        resume: {
            type: Schema.Types.ObjectId,
            ref: "Resume",
            required: true,
        },

        // Fingerprint of the resume data and job requirements
        // used to generate this matching result.
        inputHash: {
            type: String,
            required: true,
        },

        matchScore: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },

        matchedSkills: {
            type: [String],
            default: [],
        },

        missingRequiredSkills: {
            type: [String],
            default: [],
        },

        relevantEvidence: {
            type: [String],
            default: [],
        },

        experienceAssessment: {
            professionalExperienceYears: {
                type: Number,
                min: 0,
                default: null,
            },

            projectExperience: {
                type: [String],
                default: [],
            },

            assessment: {
                type: String,
                required: true,
            },
        },

        summary: {
            type: String,
            required: true,
        },

        limitations: {
            type: [String],
            default: [],
        },
    },
    { timestamps: true }
);

// One result per candidate + job + resume.
matchResultSchema.index(
    { job: 1, candidate: 1, resume: 1 },
    { unique: true }
);

const MatchResult = mongoose.model(
    "MatchResult",
    matchResultSchema
);

export default MatchResult;
