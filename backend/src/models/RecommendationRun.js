import mongoose from "mongoose";
import { Schema } from "mongoose";

const recommendationRunSchema = new Schema(
    {
        candidate: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        resume: {
            type: Schema.Types.ObjectId,
            ref: "Resume",
            required: true,
        },

        status: {
            type: String,
            enum: [
                "queued",
                "processing",
                "completed",
                "partial",
                "failed",
            ],
            default: "queued",
        },

        totalJobs: {
            type: Number,
            default: 0,
        },

        processedJobs: {
            type: Number,
            default: 0,
        },

        failedJobs: {
            type: Number,
            default: 0,
        },

        startedAt: {
            type: Date,
            default: null,
        },

        completedAt: {
            type: Date,
            default: null,
        },

        errorMessage: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

recommendationRunSchema.index({
    candidate: 1,
    createdAt: -1,
});

const RecommendationRun = mongoose.model(
    "RecommendationRun",
    recommendationRunSchema
);

export default RecommendationRun;