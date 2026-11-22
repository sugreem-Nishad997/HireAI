import mongoose from 'mongoose';
import {Schema} from 'mongoose';

const applicationStatuses = [
    "pending",
    "reviewing",
    "shortlisted",
    "interview",
    "accepted",
    "rejected",
];

const statusHistorySchema = new Schema(
    {
        previousStatus: {
            type: String,
            enum: applicationStatuses,
            default: null,
        },

        newStatus: {
            type: String,
            enum: applicationStatuses,
            required: true,
        },

        changedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        note: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },

        changedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: true }
);

const applicationSchema = new Schema(
    {
        candidate: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        job: {
            type: Schema.Types.ObjectId,
            ref: 'Job',
            required: true
        },
        resume: {
            type: Schema.Types.ObjectId,
            ref: 'Resume',
            required: true,
        },
        matchingStatus: {
            type: String,
            enum: ["queued", "processing", "completed", "failed"],
            default: "queued"
        }, 
        matchResult: {
            type: Schema.Types.ObjectId,
            ref: "MatchResult",
            default: null
        },
        status: {
            type: String,
            enum: applicationStatuses,
            default: 'pending',
            required: true
        },
        statusHistory: {
            type: [statusHistorySchema],
            default: [],
        },
        recruiterViewedAt: {
            type: Date,
            default: null
        }
    },
    {timestamps: true}
);

applicationSchema.index({candidate: 1, job: 1}, {unique: true});
applicationSchema.index({ job: 1, status: 1, createdAt: -1 });
applicationSchema.index({ candidate: 1, createdAt: -1 });

const Application = mongoose.model('Application', applicationSchema);

export default Application;
