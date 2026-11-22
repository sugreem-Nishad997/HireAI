
import "dotenv/config";

import { Worker } from "bullmq";
import mongoose from "mongoose";

import {
    createRedisConnection,
} from "../config/redis.js";

import connectDB from "../config/db.js";

import Application from "../models/Application.js";
import Resume from "../models/Resume.js";
import Job from "../models/Job.js";
import MatchResult from "../models/MatchResult.js";
import RecommendationRun from "../models/RecommendationRun.js";

import {
    matchCandidateToJob,
} from "../ai/services/candidateMatching.service.js";

import {
    generateMatchInputHash,
} from "../utils/matching.utils.js";

const QUEUE_NAME = "application-matching";

let worker;
let redisConnection;


/* ------------------------------------------
   Shared matching function
------------------------------------------ */

const getOrCreateMatchResult = async ({
    candidateId,
    resume,
    job,
}) => {
    const inputHash = generateMatchInputHash(
        resume.parsedData,
        job
    );

    // Check whether a valid result already exists.
    const existingResult = await MatchResult.findOne({
        candidate: candidateId,
        job: job._id,
        resume: resume._id,
        inputHash,
    });

    if (existingResult) {
        return {
            result: existingResult,
            reused: true,
        };
    }

    // No valid cached result. Ask Groq to calculate it.
    const match = await matchCandidateToJob(
        resume.parsedData,
        job
    );

    // Save or update the result.
    const savedResult = await MatchResult.findOneAndUpdate(
        {
            candidate: candidateId,
            job: job._id,
            resume: resume._id,
        },
        {
            $set: {
                inputHash,

                matchScore: match.matchScore,
                matchedSkills: match.matchedSkills,
                missingRequiredSkills: match.missingRequiredSkills,
                relevantEvidence: match.relevantEvidence,

                experienceAssessment: match.experienceAssessment,

                summary: match.summary,
                limitations: match.limitations,
            },
        },
        {
            upsert: true,
            new: true,
            runValidators: true,
            setDefaultsOnInsert: true,
        }
    );

    return {
        result: savedResult,
        reused: false,
    };
};


/* ------------------------------------------
   Existing application matching
------------------------------------------ */

const processApplicationMatching = async (bullJob) => {
    const { applicationId } = bullJob.data;

    if (!mongoose.isValidObjectId(applicationId)) {
        throw new Error("Invalid application ID");
    }

    const application = await Application.findById(applicationId);

    if (!application) {
        throw new Error("Application not found");
    }

    const resume = await Resume.findOne({
        _id: application.resume,
        candidate: application.candidate,
        "parsing.status": "completed",
    });

    if (!resume || !resume.parsedData) {
        throw new Error("Selected resume is missing or not parsed");
    }

    const job = await Job.findById(application.job);

    if (!job) {
        throw new Error("Job not found");
    }

    await Application.updateOne(
        { _id: application._id },
        {
            $set: {
                matchingStatus: "processing",
            },
        }
    );

    const { result, reused } = await getOrCreateMatchResult({
        candidateId: application.candidate,
        resume,
        job,
    });

    await Application.updateOne(
        { _id: application._id },
        {
            $set: {
                matchResult: result._id,
                matchingStatus: "completed",
            },
        }
    );

    console.log(
        `Application ${applicationId} matched. ` +
        `Score: ${result.matchScore}. ` +
        `Cache reused: ${reused}`
    );

    return {
        applicationId,
        matchResultId: result._id.toString(),
        matchScore: result.matchScore,
        reused,
    };
};


/* ------------------------------------------
   New recommended jobs matching
------------------------------------------ */

const processCandidateRecommendations = async (bullJob) => {
    const {
        recommendationRunId,
        candidateId,
        resumeId,
    } = bullJob.data;

    if (
        !mongoose.isValidObjectId(recommendationRunId) ||
        !mongoose.isValidObjectId(candidateId) ||
        !mongoose.isValidObjectId(resumeId)
    ) {
        throw new Error("Invalid recommendation job data");
    }

    const run = await RecommendationRun.findOne({
        _id: recommendationRunId,
        candidate: candidateId,
        resume: resumeId,
    });

    if (!run) {
        throw new Error("Recommendation run not found");
    }

    const resume = await Resume.findOne({
        _id: resumeId,
        candidate: candidateId,
        "parsing.status": "completed",
    });

    if (!resume || !resume.parsedData) {
        throw new Error("Resume is missing or not successfully parsed");
    }

    await RecommendationRun.updateOne(
        { _id: run._id },
        {
            $set: {
                status: "processing",
                startedAt: new Date(),
                completedAt: null,
                errorMessage: "",
            },
        }
    );

    // Only currently active jobs are eligible.
    const jobs = await Job.find({
        isActive: true,
    });

    let processedJobs = 0;
    let failedJobs = 0;

    await RecommendationRun.updateOne(
        { _id: run._id },
        {
            $set: {
                totalJobs: jobs.length,
                processedJobs: 0,
                failedJobs: 0,
            },
        }
    );

    // Process jobs one at a time to avoid overwhelming Groq.
    for (const job of jobs) {
        try {
            const { result, reused } = await getOrCreateMatchResult({
                candidateId,
                resume,
                job,
            });

            processedJobs++;

            console.log(
                `Recommendation run ${recommendationRunId}: ` +
                `${job.title} | Score: ${result.matchScore} | ` +
                `Cache reused: ${reused}`
            );
        } catch (error) {
            failedJobs++;

            console.error(
                `Recommendation failed for job ${job._id}:`,
                error.message
            );
        }

        // Update progress after each job.
        await RecommendationRun.updateOne(
            { _id: run._id },
            {
                $set: {
                    processedJobs,
                    failedJobs,
                },
            }
        );
    }

    // No individual job failed.
    if (failedJobs === 0) {
        await RecommendationRun.updateOne(
            { _id: run._id },
            {
                $set: {
                    status: "completed",
                    completedAt: new Date(),
                    errorMessage: "",
                },
            }
        );

        return {
            recommendationRunId,
            totalJobs: jobs.length,
            processedJobs,
            failedJobs,
            status: "completed",
        };
    }

    // If some jobs failed, throw so BullMQ retries the run.
    // Successful results will be reused through inputHash.
    throw new Error(
        `${failedJobs} out of ${jobs.length} job matches failed`
    );
};


/* ------------------------------------------
   Queue job dispatcher
------------------------------------------ */

const processMatchingJob = async (bullJob) => {
    switch (bullJob.name) {
        case "match-application":
            return processApplicationMatching(bullJob);

        case "match-candidate-jobs":
            return processCandidateRecommendations(bullJob);

        default:
            throw new Error(
                `Unsupported matching job type: ${bullJob.name}`
            );
    }
};


/* ------------------------------------------
   Worker startup
------------------------------------------ */

const startWorker = async () => {
    try {
        await connectDB();

        console.log("MongoDB connected for matching worker");

        redisConnection = createRedisConnection();

        worker = new Worker(
            QUEUE_NAME,
            processMatchingJob,
            {
                connection: redisConnection,
                concurrency: 3,
            }
        );

        worker.on("completed", (job, result) => {
            console.log(`Job ${job.id} completed`, result);
        });

        worker.on("failed", async (job, error) => {
            console.error(
                `Job ${job?.id} failed:`,
                error.message
            );

            if (!job) return;

            const maxAttempts = job.opts.attempts || 1;

            // Only update database status after final retry.
            if (job.attemptsMade < maxAttempts) return;

            try {
                if (job.name === "match-application") {
                    await Application.updateOne(
                        {
                            _id: job.data.applicationId,
                            matchingStatus: { $ne: "completed" },
                        },
                        {
                            $set: {
                                matchingStatus: "failed",
                            },
                        }
                    );
                }

                if (job.name === "match-candidate-jobs") {
                    const run = await RecommendationRun.findById(
                        job.data.recommendationRunId
                    );

                    if (run) {
                        await RecommendationRun.updateOne(
                            { _id: run._id },
                            {
                                $set: {
                                    status:
                                        run.processedJobs > 0
                                            ? "partial"
                                            : "failed",

                                    completedAt: new Date(),

                                    errorMessage: error.message,
                                },
                            }
                        );
                    }
                }
            } catch (updateError) {
                console.error(
                    "Failed to update matching status:",
                    updateError.message
                );
            }
        });

        worker.on("error", (error) => {
            console.error("Worker error:", error.message);
        });

        console.log("HireAI matching worker is running");
    } catch (error) {
        console.error("Worker startup failed:", error);
        process.exit(1);
    }
};


/* ------------------------------------------
   Graceful shutdown
------------------------------------------ */

const shutdown = async (signal) => {
    console.log(`${signal}: Shutting down worker...`);

    if (worker) {
        await worker.close();
    }

    if (redisConnection) {
        await redisConnection.quit();
    }

    await mongoose.disconnect();

    process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));

process.on("SIGTERM", () => shutdown("SIGTERM"));

startWorker();
