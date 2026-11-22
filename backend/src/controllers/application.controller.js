import mongoose from "mongoose";
import httpStatus from "http-status";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import Resume from "../models/Resume.js";
import User from "../models/User.js";
import {matchingQueue} from "../queues/matching.queue.js";

const applicationStatuses = [
  "pending",
  "reviewing",
  "interview",
  "accepted",
  "rejected",
];

const requireRole = (req, res, role, message) => {
  if (req.user.role === role) {
    return true;
  }

  res.status(httpStatus.FORBIDDEN).json({
    success: false,
    message,
  });
  return false;
};

export const applyToJob = async (req, res, next) => {
  try {
    if (
      !requireRole(
        req,
        res,
        "candidate",
        "Only candidates can apply to jobs."
      )
    ) {
      return;
    }

    const {jobId} = req.params;
    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Invalid job ID.",
      });
    }

    const job = await Job.findOne({_id: jobId, isActive: true}).select("_id");
    if (!job) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Active job not found.",
      });
    }

    const {resumeId} = req.body ?? {};
    if (!mongoose.isValidObjectId(resumeId)) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "A valid resume ID is required.",
      });
    }

    const resume = await Resume.findOne({
      _id: resumeId,
      candidate: req.user._id,
      "parsing.status": "completed",
    }).select("_id");

    if (!resume) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Selected resume not found or is not ready to use.",
      });
    }

    const application = await Application.create({
      candidate: req.user._id,
      job: job._id,
      resume: resume._id,

      status: "pending",

      statusHistory: [
        {
          previousStatus: null,
          newStatus: "pending",
          changedBy: req.user._id,
          note: "Application submitted",
          changedAt: new Date(),
        },
      ],
    });

    await matchingQueue.add(
      "match-application",
      {
        applicationId: application._id.toString(),
      },
      {
        jobId:`application-${application._id}`
      }
    );

    return res.status(httpStatus.CREATED).json({
      success: true,
      data: application,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(httpStatus.CONFLICT).json({
        success: false,
        message: "You have already applied to this job.",
      });
    }

    return next(error);
  }
};

export const getMyApplications = async (req, res, next) => {
  try {
    if (
      !requireRole(
        req,
        res,
        "candidate",
        "Only candidates can view their applications."
      )
    ) {
      return;
    }

    const applications = await Application.find({candidate: req.user._id})
      .populate({
        path: "job",
        select: "title description isActive company companyName recruiter",
        populate: {
          path: "recruiter",
          select: "name",
        },
      })
      .populate({
        path: "resume",
        select: "file.originalName parsing.status createdAt",
      })
      .populate({
        path: "matchResult",
        select: "matchScore summary matchedSkills missingRequiredSkills",
      })
      .populate({
        path: "statusHistory.changedBy",
        select: "name role",
      })
      .sort({createdAt: -1})
      .lean();

    return res.status(httpStatus.OK).json({
      success: true,
      data: applications,
    });
  } catch (error) {
    return next(error);
  }
};

export const getApplicationsForJob = async (req, res, next) => {
  try {
    if (
      !requireRole(
        req,
        res,
        "recruiter",
        "Only recruiters can view applications for a job."
      )
    ) {
      return;
    }

    const {jobId} = req.params;
    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Invalid job ID.",
      });
    }

    const job = await Job.findOne({
      _id: jobId,
      recruiter: req.user._id,
    }).select("_id");

    if (!job) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Job not found or you do not own it.",
      });
    }

    await Application.updateMany(
      {
        job: job._id,
        $or: [
          {recruiterViewedAt: null},
          {recruiterViewedAt: {$exists: false}},
        ],
      },
      {$set: {recruiterViewedAt: new Date()}}
    );

    const applications = await Application.find({job: job._id})
      .populate({
        path: "candidate",
        model: User,
        select: "name email",
      })
      .populate({
        path: "resume",
        select: "_id file.originalName parsing.status",
      })
      .populate({
        path: "matchResult",
        select: "matchScore matchedSkills missingRequiredSkills relevantEvidence experienceAssessment limitations",
      })
      .populate({
        path: "statusHistory.changedBy",
        select: "name role"
      })
      .sort({createdAt: -1})
      .lean();

    return res.status(httpStatus.OK).json({
      success: true,
      data: applications,
    });
  } catch (error) {
    return next(error);
  }
};


export const updateApplicationStatus = async (req, res, next) => {
    try {
        if (
            !requireRole(
                req,
                res,
                "recruiter",
                "Only recruiters can update application statuses."
            )
        ) {
            return;
        }

        const { applicationId } = req.params;
        const { status, note = "" } = req.body ?? {};

        if (!mongoose.isValidObjectId(applicationId)) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: "Invalid application ID.",
            });
        }

        if (!applicationStatuses.includes(status)) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: `status must be one of: ${applicationStatuses.join(", ")}.`,
            });
        }

        if (typeof note !== "string" || note.length > 1000) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: "Note must be a string of at most 1000 characters.",
            });
        }

        const application = await Application.findById(applicationId);

        if (!application) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: "Application not found.",
            });
        }

        // Verify job ownership.
        const job = await Job.findOne({
            _id: application.job,
            recruiter: req.user._id,
        }).select("_id");

        if (!job) {
            return res.status(httpStatus.FORBIDDEN).json({
                success: false,
                message: "You cannot update applications for this job.",
            });
        }

        const previousStatus = application.status;

        if (previousStatus === status) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: "Application already has this status.",
            });
        }

        // Update status and history atomically.
        const updatedApplication = await Application.findOneAndUpdate(
            {
                _id: applicationId,
                status: previousStatus,
            },
            {
                $set: {
                    status,
                    recruiterViewedAt:
                        application.recruiterViewedAt || new Date(),
                },
                $push: {
                    statusHistory: {
                        previousStatus,
                        newStatus: status,
                        changedBy: req.user._id,
                        note: note.trim(),
                        changedAt: new Date(),
                    },
                },
            },
            {
                new: true,
                runValidators: true,
            }
        )
            .populate("candidate", "name email")
            .populate({
                path: "resume",
                select: "_id file.originalName parsing.status",
            })
            .populate("statusHistory.changedBy", "name role")
            .lean();

        if (!updatedApplication) {
            return res.status(httpStatus.CONFLICT).json({
                success: false,
                message: "Application changed concurrently. Please refresh and try again.",
            });
        }

        return res.status(httpStatus.OK).json({
            success: true,
            message: "Application status updated successfully.",
            data: updatedApplication,
        });

    } catch (error) {
        return next(error);
    }
};
