import mongoose from 'mongoose';
import httpStatus from 'http-status';
import Job from '../models/Job.js';
import SavedJob from '../models/SavedJob.js';

const requireCandidate = (req, res) => {
  if (req.user.role === 'candidate') return true;

  res.status(httpStatus.FORBIDDEN).json({
    success: false,
    message: 'Only candidates can save jobs.',
  });
  return false;
};

export const getMySavedJobs = async (req, res, next) => {
  try {
    if (!requireCandidate(req, res)) return;

    const savedJobs = await SavedJob.find({candidate: req.user._id})
      .populate({
        path: 'job',
        match: {isActive: true},
        select: 'title description requiredSkills preferredSkills minimumExperienceYears isActive createdAt',
      })
      .sort({createdAt: -1})
      .lean();

    return res.status(httpStatus.OK).json({
      success: true,
      data: savedJobs.filter((savedJob) => savedJob.job),
    });
  } catch (error) {
    return next(error);
  }
};

export const saveJob = async (req, res, next) => {
  try {
    if (!requireCandidate(req, res)) return;

    const {jobId} = req.params;
    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Invalid job ID.',
      });
    }

    const job = await Job.findOne({_id: jobId, isActive: true}).select('_id');
    if (!job) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: 'Active job not found.',
      });
    }

    const savedJob = await SavedJob.findOneAndUpdate(
      {candidate: req.user._id, job: job._id},
      {$setOnInsert: {candidate: req.user._id, job: job._id}},
      {new: true, upsert: true, setDefaultsOnInsert: true},
    ).lean();

    return res.status(httpStatus.OK).json({
      success: true,
      data: savedJob,
    });
  } catch (error) {
    return next(error);
  }
};

export const unsaveJob = async (req, res, next) => {
  try {
    if (!requireCandidate(req, res)) return;

    const {jobId} = req.params;
    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Invalid job ID.',
      });
    }

    await SavedJob.findOneAndDelete({
      candidate: req.user._id,
      job: jobId,
    });

    return res.status(httpStatus.OK).json({
      success: true,
      message: 'Job removed from saved jobs.',
    });
  } catch (error) {
    return next(error);
  }
};
