import mongoose from "mongoose";
import httpStatus from "http-status";
import Job from "../models/Job.js";
import Application from "../models/Application.js";

const editableJobFields = [
  "title",
  "description",
  "requiredSkills",
  "preferredSkills",
  "minimumExperienceYears",
  "isActive",
];

const isValidSkills = (skills) =>
  Array.isArray(skills) &&
  skills.every((skill) => typeof skill === "string" && skill.trim().length > 0);

const validateJobFields = (fields) => {
  if ("title" in fields && (typeof fields.title !== "string" || !fields.title.trim())) {
    return "A non-empty title is required.";
  }

  if (
    "description" in fields &&
    (typeof fields.description !== "string" || !fields.description.trim())
  ) {
    return "A non-empty description is required.";
  }

  for (const field of ["requiredSkills", "preferredSkills"]) {
    if (field in fields && !isValidSkills(fields[field])) {
      return `${field} must be an array of non-empty strings.`;
    }
  }

  if (
    "minimumExperienceYears" in fields &&
    (!Number.isFinite(fields.minimumExperienceYears) ||
      fields.minimumExperienceYears < 0)
  ) {
    return "minimumExperienceYears must be a non-negative number.";
  }

  if ("isActive" in fields && typeof fields.isActive !== "boolean") {
    return "isActive must be a boolean.";
  }

  return null;
};

const isRecruiter = (req, res) => {
  if (req.user.role === "recruiter") {
    return true;
  }

  res.status(httpStatus.FORBIDDEN).json({
    success: false,
    message: "Only recruiters can manage jobs.",
  });
  return false;
};

export const createJob = async (req, res, next) => {
  try {
    if (!isRecruiter(req, res)) return;

    const body = req.body ?? {};
    const fields = Object.fromEntries(
      editableJobFields
        .filter((field) => field in body)
        .map((field) => [field, body[field]])
    );

    if (!("title" in fields) || !("description" in fields)) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "title and description are required.",
      });
    }

    const validationMessage = validateJobFields(fields);
    if (validationMessage) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: validationMessage,
      });
    }

    const job = await Job.create({
      ...fields,
      recruiter: req.user._id,
    });

    return res.status(httpStatus.CREATED).json({
      success: true,
      data: job,
    });
  } catch (error) {
    return next(error);
  }
};

export const listJobs = async (req, res, next) => {
  try {
    const filter = req.user.role === "recruiter"
      ? {recruiter: req.user._id}
      : {isActive: true};
    const jobs = await Job.find(filter)
      .sort({createdAt: -1})
      .lean();

    if (req.user.role === "recruiter" && jobs.length > 0) {
      const applicationCounts = await Application.aggregate([
        {$match: {job: {$in: jobs.map((job) => job._id)}}},
        {$group: {_id: "$job", count: {$sum: 1}}},
      ]);
      const countByJobId = new Map(
        applicationCounts.map(({_id, count}) => [_id.toString(), count])
      );
      for (const job of jobs) {
        job.applicantCount = countByJobId.get(job._id.toString()) ?? 0;
      }
    }

    return res.status(httpStatus.OK).json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    return next(error);
  }
};

export const getJobById = async (req, res, next) => {
  try {
    const {jobId} = req.params;

    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Invalid job ID.",
      });
    }

    const filter = req.user.role === "recruiter"
      ? {_id: jobId, recruiter: req.user._id}
      : {_id: jobId, isActive: true};
    const job = await Job.findOne(filter).lean();

    if (!job) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Job not found.",
      });
    }

    return res.status(httpStatus.OK).json({
      success: true,
      data: job,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateJob = async (req, res, next) => {
  try {
    if (!isRecruiter(req, res)) return;

    const body = req.body ?? {};
    const {jobId} = req.params;
    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Invalid job ID.",
      });
    }

    const fields = Object.fromEntries(
      editableJobFields
        .filter((field) => field in body)
        .map((field) => [field, body[field]])
    );

    if (Object.keys(fields).length === 0) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Provide at least one editable job field.",
      });
    }

    const validationMessage = validateJobFields(fields);
    if (validationMessage) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: validationMessage,
      });
    }

    const job = await Job.findOneAndUpdate(
      {_id: jobId, recruiter: req.user._id},
      {$set: fields},
      {new: true, runValidators: true}
    );

    if (!job) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Job not found or you do not own it.",
      });
    }

    return res.status(httpStatus.OK).json({
      success: true,
      data: job,
    });
  } catch (error) {
    return next(error);
  }
};

export const deactivateJob = async (req, res, next) => {
  try {
    if (!isRecruiter(req, res)) return;

    const {jobId} = req.params;
    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Invalid job ID.",
      });
    }

    const job = await Job.findOneAndUpdate(
      {_id: jobId, recruiter: req.user._id},
      {$set: {isActive: false}},
      {new: true}
    );

    if (!job) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Job not found or you do not own it.",
      });
    }

    return res.status(httpStatus.OK).json({
      success: true,
      message: "Job deactivated.",
      data: job,
    });
  } catch (error) {
    return next(error);
  }
};
