import mongoose from 'mongoose';
import {Schema} from 'mongoose';

const resumeSchema = new Schema(
    {
        candidate: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        file: {
            originalName: {
                type: String,
                required: true
            },
            storageKey: {
                type: String,
                required: true
            },
            mimeType: {
                type: String,
                enum: [
                    "application/pdf",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ],
                required: true
            },
            size: {
                type: Number,
                required: true
            }
        },
        extractedText: {
            type: String,
            select: false
        },

        parsedData: {
            fullName: { type: String, default: "" },
            email: { type: String, default: "" },
            phone: { type: String, default: "" },
            location: { type: String, default: "" },
            summary: { type: String, default: "" },

            skills: {
                type: [String],
                default: [],
            },

            education: {
                type: [
                {
                    degree: { type: String, default: "" },
                    institution: { type: String, default: "" },
                    fieldOfStudy: { type: String, default: "" },
                    graduationYear: { type: String, default: "" },
                },
                ],
                default: [],
            },

            experience: {
                type: [
                {
                    company: { type: String, default: "" },
                    jobTitle: { type: String, default: "" },
                    startDate: { type: String, default: "" },
                    endDate: { type: String, default: "" },
                    description: { type: String, default: "" },
                },
                ],
                default: [],
            },

            projects: {
                type: [
                {
                    name: { type: String, default: "" },
                    description: { type: String, default: "" },
                    technologies: {
                        type: [String],
                        default: [],
                    },
                },
                ],
                default: [],
            },
        },

        parsing: {
            status: {
                type: String,
                enum: ["pending", "processing", "completed", "failed"],
                default: "pending",
            },
            errorMessage: String,
            completedAt: Date,
        },
    },
    {timestamps: true}
);

const Resume = mongoose.model('Resume', resumeSchema);
export default Resume;