
import mongoose from "mongoose";
import httpStatus from "http-status";

import Resume from "../models/Resume.js";
import Job from "../models/Job.js";
import MatchResult from "../models/MatchResult.js";
import RecommendationRun from "../models/RecommendationRun.js";

import { matchingQueue } from "../queues/matching.queue.js";


/* ------------------------------------------
   Helper: Validate candidate role
------------------------------------------ */

const requireCandidate = (req, res) => {
    if (req.user?.role !== "candidate") {
        res.status(httpStatus.FORBIDDEN).json({
            success: false,
            message: "Only candidates can access recommendations.",
        });

        return false;
    }

    return true;
};


/* ------------------------------------------
   Helper: Find latest successfully parsed resume
------------------------------------------ */

const getLatestParsedResume = async (candidateId) => {
    return Resume.findOne({
        candidate: candidateId,
        "parsing.status": "completed",
    })
        .sort({ createdAt: -1 });
};


/* ------------------------------------------
   1. GET RECOMMENDED JOBS
------------------------------------------ */

export const getRecommendedJobs = async (req, res) => {
    try {
        if (!requireCandidate(req, res)) return;

        const candidateId = req.user._id;

        const page = Math.max(
            1,
            parseInt(req.query.page, 10) || 1
        );

        const limit = Math.min(
            50,
            Math.max(1, parseInt(req.query.limit, 10) || 10)
        );

        const skip = (page - 1) * limit;

        // Find the latest successfully parsed resume.
        const resume = await getLatestParsedResume(candidateId);

        if (!resume) {
            return res.status(httpStatus.OK).json({
                success: true,
                message: "Please upload and successfully parse a resume to get job recommendations.",
                data: {
                    resume: null,
                    runStatus: "no_resume",
                    jobs: [],
                    pagination: {
                        page,
                        limit,
                        total: 0,
                        totalPages: 0,
                    },
                },
            });
        }

        // Get the latest recommendation run for this resume.
        const latestRun = await RecommendationRun.findOne({
            candidate: candidateId,
            resume: resume._id,
        }).sort({ createdAt: -1 });

        // Only show matches for active jobs and the selected resume.
        const matchFilter = {
            candidate: candidateId,
            resume: resume._id,
            job: {
                $in: await Job.find({
                    isActive: true,
                }).distinct("_id"),
            },
        };

        const total = await MatchResult.countDocuments(matchFilter);

        const matches = await MatchResult.find(matchFilter)
            .populate({
                path: "job",
                select: [
                    "title",
                    "description",
                    "requiredSkills",
                    "preferredSkills",
                    "minimumExperienceYears",
                    "recruiter",
                    "isActive",
                    "createdAt",
                ].join(" "),
                populate: {
                    path: "recruiter",
                    select: "name",
                },
            })
            .sort({
                matchScore: -1,
                createdAt: -1,
            })
            .skip(skip)
            .limit(limit)
            .lean();

        // Remove results whose job is no longer available.
        const jobs = matches
            .filter((match) => match.job?.isActive)
            .map((match) => ({
                jobId: match.job._id,
                title: match.job.title,
                description: match.job.description,
                requiredSkills: match.job.requiredSkills,
                preferredSkills: match.job.preferredSkills,
                minimumExperienceYears:
                    match.job.minimumExperienceYears,
                recruiterName: match.job.recruiter?.name || "",
                createdAt: match.job.createdAt,

                matchScore: match.matchScore,
                matchedSkills: match.matchedSkills,
                missingRequiredSkills:
                    match.missingRequiredSkills,
                relevantEvidence: match.relevantEvidence,
                experienceAssessment:
                    match.experienceAssessment,
                summary: match.summary,
                limitations: match.limitations,

                matchResultId: match._id,
            }));

        return res.status(httpStatus.OK).json({
            success: true,
            data: {
                resume: {
                    id: resume._id,
                    fileName: resume.file.originalName,
                    uploadedAt: resume.createdAt,
                },

                runStatus: latestRun?.status || "not_started",

                progress: latestRun
                    ? {
                        totalJobs: latestRun.totalJobs,
                        processedJobs: latestRun.processedJobs,
                        failedJobs: latestRun.failedJobs,
                    }
                    : null,

                jobs,

                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
        });

    } catch (error) {
        console.error("Get recommended jobs error:", error);

        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to fetch recommended jobs.",
        });
    }
};


/* ------------------------------------------
   2. REFRESH RECOMMENDATIONS
------------------------------------------ */

export const refreshRecommendations = async (req, res) => {
    try {
        if (!requireCandidate(req, res)) return;

        const candidateId = req.user._id;

        const resume = await getLatestParsedResume(candidateId);

        if (!resume) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: "Upload and successfully parse a resume before generating recommendations.",
            });
        }

        // Do not create another run while one is active.
        const activeRun = await RecommendationRun.findOne({
            candidate: candidateId,
            resume: resume._id,
            status: {
                $in: ["queued", "processing"],
            },
        }).sort({ createdAt: -1 });

        if (activeRun) {
            return res.status(httpStatus.OK).json({
                success: true,
                message: "Recommendation generation is already in progress.",
                data: {
                    runId: activeRun._id,
                    status: activeRun.status,
                },
            });
        }

        const run = await RecommendationRun.create({
            candidate: candidateId,
            resume: resume._id,
            status: "queued",
        });

        try {
            await matchingQueue.add(
                "match-candidate-jobs",
                {
                    recommendationRunId: run._id.toString(),
                    candidateId: candidateId.toString(),
                    resumeId: resume._id.toString(),
                },
                {
                    jobId: `recommendations-${run._id}`,
                }
            );
        } catch (queueError) {
            await RecommendationRun.updateOne(
                { _id: run._id },
                {
                    $set: {
                        status: "failed",
                        completedAt: new Date(),
                        errorMessage: "Unable to enqueue recommendation task.",
                    },
                }
            );

            throw queueError;
        }

        return res.status(httpStatus.ACCEPTED).json({
            success: true,
            message: "Recommendation generation started.",
            data: {
                runId: run._id,
                status: run.status,
            },
        });

    } catch (error) {
        console.error("Refresh recommendations error:", error);

        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to start recommendation generation.",
        });
    }
};


/* ------------------------------------------
   3. GET RECOMMENDATION STATUS
------------------------------------------ */

export const getRecommendationStatus = async (req, res) => {
    try {
        if (!requireCandidate(req, res)) return;

        const candidateId = req.user._id;

        const resume = await getLatestParsedResume(candidateId);

        if (!resume) {
            return res.status(httpStatus.OK).json({
                success: true,
                data: {
                    status: "no_resume",
                    progress: null,
                },
            });
        }

        const run = await RecommendationRun.findOne({
            candidate: candidateId,
            resume: resume._id,
        }).sort({ createdAt: -1 });

        if (!run) {
            return res.status(httpStatus.OK).json({
                success: true,
                data: {
                    status: "not_started",
                    progress: null,
                },
            });
        }

        return res.status(httpStatus.OK).json({
            success: true,
            data: {
                runId: run._id,
                status: run.status,

                progress: {
                    totalJobs: run.totalJobs,
                    processedJobs: run.processedJobs,
                    failedJobs: run.failedJobs,
                },

                startedAt: run.startedAt,
                completedAt: run.completedAt,
                errorMessage: run.errorMessage,
            },
        });

    } catch (error) {
        console.error("Get recommendation status error:", error);

        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to fetch recommendation status.",
        });
    }
};


/* ------------------------------------------
   4. GET JOB MATCH DETAILS
------------------------------------------ */

export const getRecommendedJobDetails = async (req, res) => {
    try {
        if (!requireCandidate(req, res)) return;

        const candidateId = req.user._id;
        const { jobId } = req.params;

        if (!mongoose.isValidObjectId(jobId)) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: "Invalid job ID.",
            });
        }

        const resume = await getLatestParsedResume(candidateId);

        if (!resume) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: "No successfully parsed resume found.",
            });
        }

        const job = await Job.findOne({
            _id: jobId,
            isActive: true,
        }).select(
            "title description requiredSkills preferredSkills minimumExperienceYears recruiter createdAt"
        ).populate("recruiter", "name");

        if (!job) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: "Job not found or no longer active.",
            });
        }

        const match = await MatchResult.findOne({
            candidate: candidateId,
            resume: resume._id,
            job: jobId,
        });

        if (!match) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: "Match details are not available yet.",
            });
        }

        return res.status(httpStatus.OK).json({
            success: true,
            data: {
                job,
                match: {
                    matchScore: match.matchScore,
                    matchedSkills: match.matchedSkills,
                    missingRequiredSkills:
                        match.missingRequiredSkills,
                    relevantEvidence: match.relevantEvidence,
                    experienceAssessment:
                        match.experienceAssessment,
                    summary: match.summary,
                    limitations: match.limitations,
                },
            },
        });

    } catch (error) {
        console.error("Get recommended job details error:", error);

        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to fetch job match details.",
        });
    }
};
