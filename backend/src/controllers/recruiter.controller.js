import httpStatus from "http-status";
import Application from "../models/Application.js";
import Job from "../models/Job.js";

const AI_QUALIFIED_SCORE_THRESHOLD = 70;

export const getRecruiterDashboard = async (req, res, next) => {
  try {
    if (req.user.role !== "recruiter") {
      return res.status(httpStatus.FORBIDDEN).json({
        success: false,
        message: "Only recruiters can view recruiter dashboard data.",
      });
    }

    const jobs = await Job.find({recruiter: req.user._id})
      .select("_id isActive")
      .lean();
    const jobIds = jobs.map(({_id}) => _id);
    const applications = jobIds.length > 0
      ? await Application.find({job: {$in: jobIds}})
        .select("candidate job resume matchResult")
        .populate({path: "candidate", select: "name"})
        .populate({path: "job", select: "title"})
        .populate({path: "resume", select: "parsedData.location"})
        .populate({path: "matchResult", select: "matchScore"})
        .sort({createdAt: -1})
        .lean()
      : [];

    const qualifiedCandidateIds = new Set(
      applications
        .filter(
          ({matchResult}) =>
            matchResult?.matchScore >= AI_QUALIFIED_SCORE_THRESHOLD
        )
        .map(({candidate}) => candidate?._id?.toString())
        .filter(Boolean)
    );

    return res.status(httpStatus.OK).json({
      success: true,
      data: {
        metrics: {
          activeJobs: jobs.filter(({isActive}) => isActive).length,
          totalApplicants: applications.length,
          aiQualifiedCandidates: qualifiedCandidateIds.size,
          aiQualifiedScoreThreshold: AI_QUALIFIED_SCORE_THRESHOLD,
        },
        candidates: applications.map((application) => ({
          id: application._id.toString(),
          name:
            application.candidate?.name ||
            application.resume?.parsedData?.fullName ||
            "Candidate",
          role: application.job?.title || "Job unavailable",
          matchScore: application.matchResult?.matchScore ?? null,
          location:
            application.resume?.parsedData?.location?.trim() ||
            "Not provided",
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
};