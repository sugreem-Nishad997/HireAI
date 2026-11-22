import bcrypt from "bcrypt";
import httpStatus from "http-status";
import CandidateProfile from "../models/CandidateProfile.js";
import User from "../models/User.js";
import Resume from "../models/Resume.js";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import SavedJob from "../models/SavedJob.js";
import MatchResult from "../models/MatchResult.js";
import {deleteResumeFromCloudinary} from "../services/cloudinary.service.js";

const profileFields = [
  "fullName",
  "email",
  "phone",
  "location",
  "summary",
  "skills",
  "education",
  "experience",
  "projects",
];

const requireCandidate = (req, res) => {
  if (req.user.role === "candidate") return true;

  res.status(httpStatus.FORBIDDEN).json({
    success: false,
    message: "Only candidates can manage a candidate profile.",
  });
  return false;
};

export const getMyProfile = async (req, res, next) => {
  try {
    if (!requireCandidate(req, res)) return;

    const profile = await CandidateProfile.findOne({candidate: req.user._id}).lean();
    return res.status(httpStatus.OK).json({success: true, data: profile});
  } catch (error) {
    return next(error);
  }
};

export const updateMyProfile = async (req, res, next) => {
  try {
    if (!requireCandidate(req, res)) return;

    const body = req.body ?? {};
    const fields = Object.fromEntries(
      profileFields
        .filter((field) => Object.hasOwn(body, field))
        .map((field) => [field, body[field]])
    );

    if (!Object.keys(fields).length) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Provide at least one profile field to update.",
      });
    }

    for (const field of ["fullName", "email", "phone", "location", "summary"]) {
      if (field in fields && typeof fields[field] !== "string") {
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: `${field} must be a string.`,
        });
      }
    }

    if (
      "email" in fields &&
      fields.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())
    ) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "A valid email address is required.",
      });
    }

    if (
      "skills" in fields &&
      (!Array.isArray(fields.skills) ||
        !fields.skills.every((skill) => typeof skill === "string"))
    ) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "skills must be an array of strings.",
      });
    }

    for (const field of ["education", "experience", "projects"]) {
      if (
        field in fields &&
        (!Array.isArray(fields[field]) ||
          !fields[field].every((item) => item && typeof item === "object" && !Array.isArray(item)))
      ) {
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: `${field} must be an array of objects.`,
        });
      }
    }

    const profile = await CandidateProfile.findOneAndUpdate(
      {candidate: req.user._id},
      {$set: fields, $setOnInsert: {candidate: req.user._id}},
      {new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true}
    ).lean();

    return res.status(httpStatus.OK).json({success: true, data: profile});
  } catch (error) {
    if (error.code === 11000 && (error.keyPattern?.email || error.keyValue?.email)) {
      return res.status(httpStatus.CONFLICT).json({
        success: false,
        message: "That email address is already in use.",
      });
    }
    return next(error);
  }
};

export const updateMyAccount = async (req, res, next) => {
  try {
    const {name, email} = req.body ?? {};
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "A non-empty name and valid email address are required.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {$set: {name: name.trim(), email: email.trim().toLowerCase()}},
      {new: true, runValidators: true}
    ).select("_id name email role");

    return res.status(httpStatus.OK).json({success: true, data: user});
  } catch (error) {
    if (error.code === 11000) {
      return res.status(httpStatus.CONFLICT).json({
        success: false,
        message: "That email address is already in use.",
      });
    }
    return next(error);
  }
};

export const deleteMyProfile = async (req, res, next) => {
  try {
    if (!requireCandidate(req, res)) return;

    await CandidateProfile.deleteOne({candidate: req.user._id});
    return res.status(httpStatus.OK).json({
      success: true,
      message: "Candidate profile deleted.",
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteMyAccount = async (req, res, next) => {
  try {
    const {password} = req.body ?? {};
    if (typeof password !== "string" || !password) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Enter your password to delete your account.",
      });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(httpStatus.FORBIDDEN).json({
        success: false,
        message: "The password is incorrect.",
      });
    }

    const resumes = await Resume.find({candidate: user._id}).select("_id file.storageKey");
    for (const resume of resumes) {
      await deleteResumeFromCloudinary(resume.file.storageKey);
    }

    const resumeIds = resumes.map(({_id}) => _id);
    const recruiterJobs = await Job.find({recruiter: user._id}).select("_id");
    const jobIds = recruiterJobs.map(({_id}) => _id);

    await MatchResult.deleteMany({
      $or: [
        {candidate: user._id},
        {resume: {$in: resumeIds}},
        {job: {$in: jobIds}},
      ],
    });
    await Application.deleteMany({
      $or: [{candidate: user._id}, {job: {$in: jobIds}}],
    });
    await SavedJob.deleteMany({
      $or: [{candidate: user._id}, {job: {$in: jobIds}}],
    });
    await CandidateProfile.deleteOne({candidate: user._id});
    await Resume.deleteMany({candidate: user._id});
    await Job.deleteMany({recruiter: user._id});
    await user.deleteOne();

    return res.status(httpStatus.OK).json({
      success: true,
      message: "Account and associated data deleted.",
    });
  } catch (error) {
    return next(error);
  }
};
