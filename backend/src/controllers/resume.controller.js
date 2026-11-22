import mongoose from "mongoose";
import CandidateProfile from "../models/CandidateProfile.js";
import Resume from "../models/Resume.js";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import cloudinary from "../config/cloudinary.js";
import {
  uploadResumeToCloudinary,
  deleteResumeFromCloudinary,
} from "../services/cloudinary.service.js";
import { extractResumeText } from "../services/resumeText.service.js";
import { parseResumeWithAI } from "../ai/services/resumeParser.service.js";
import httpStatus from "http-status";
import mammoth from "mammoth";
import sanitizeHtml from "sanitize-html";

export const uploadResumeController = async (req, res, next) => {
  let uploadedAsset;
  let createdResume;

  try {
    if (req.user.role !== "candidate") {
      return res.status(httpStatus.FORBIDDEN).json({
        success: false,
        message: "Only candidates can upload resumes.",
      });
    }

    if (!req.file) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Please upload a PDF or DOCX resume.",
      });
    }

    const candidateId = req.user._id.toString();

    // Upload the actual file to Cloudinary
    uploadedAsset = await uploadResumeToCloudinary(
      req.file,
      candidateId
    );

    const resumeText = await extractResumeText(req.file);

    const parsedData = await parseResumeWithAI(resumeText);
    if (!parsedData || typeof parsedData !== "object" || Array.isArray(parsedData)) {
      throw new Error("Resume parser returned invalid profile data.");
    }

    // Store the Cloudinary reference in MongoDB
    createdResume = await Resume.create({
      candidate: candidateId,
      file: {
        originalName: req.file.originalname,
        storageKey: uploadedAsset.public_id,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
      parsing: {
        status: "pending",
      },
      parsedData: parsedData,
      parsing: {
        status: "completed",
      },
    });

    const profileUpdates = {};
    for (const field of ["fullName", "email", "phone", "location", "summary"]) {
      const value = parsedData[field];
      if (typeof value === "string" && value.trim()) {
        profileUpdates[field] = value.trim();
      }
    }
    for (const field of ["skills", "education", "experience", "projects"]) {
      if (Array.isArray(parsedData[field]) && parsedData[field].length) {
        profileUpdates[field] = parsedData[field];
      }
    }

    await CandidateProfile.findOneAndUpdate(
      {candidate: candidateId},
      {
        $set: profileUpdates,
        $setOnInsert: {candidate: candidateId},
      },
      {upsert: true, runValidators: true, setDefaultsOnInsert: true}
    );

    return res.status(httpStatus.CREATED).json({
      success: true,
      message: "Resume uploaded successfully.",
      data: {
        resumeId: createdResume._id,
        originalName: createdResume.file.originalName,
        mimeType: createdResume.file.mimeType,
        size: createdResume.file.size,
        parsingStatus: createdResume.parsing.status,
        parsedData: createdResume.parsedData,
      },
    });
  } catch (error) {
    // Remove persisted metadata and the uploaded asset if parsing or persistence fails.
    if (createdResume) {
      try {
        await createdResume.deleteOne();
      } catch (cleanupError) {
        console.error("Resume cleanup failed:", cleanupError.message);
      }
    }

    if (uploadedAsset?.public_id) {
      try {
        await deleteResumeFromCloudinary(uploadedAsset.public_id);
      } catch (cleanupError) {
        console.error(
          "Cloudinary cleanup failed:",
          cleanupError.message
        );
      }
    }

    return next(error);
  }
};

export const getResumeController = async (req, res, next) => {
  try {
    if (req.user.role !== "candidate") {
      return res.status(httpStatus.FORBIDDEN).json({
        success: false,
        message: "Only candidates can fetch their resumes.",
      });
    }

    const {resumeId} = req.params;

    if (!mongoose.isValidObjectId(resumeId)) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Invalid resume ID.",
      });
    }

    const resume = await Resume.findOne({
      _id: resumeId,
      candidate: req.user._id,
    })
      .select("-file.storageKey -extractedText")
      .lean();

    if (!resume) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Resume not found.",
      });
    }

    return res.status(httpStatus.OK).json({
      success: true,
      data: resume,
    });
  } catch (error) {
    return next(error);
  }
};

export const getMyResumesController = async (req, res, next) => {
  try {
    if (req.user.role !== "candidate") {
      return res.status(httpStatus.FORBIDDEN).json({
        success: false,
        message: "Only candidates can fetch their resumes.",
      });
    }

    const resumes = await Resume.find({candidate: req.user._id})
      .select("-file.storageKey -extractedText")
      .sort({createdAt: -1})
      .lean();

    return res.status(httpStatus.OK).json({
      success: true,
      data: resumes,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteResumeController = async (req, res, next) => {
  try {
    if (req.user.role !== "candidate") {
      return res.status(httpStatus.FORBIDDEN).json({
        success: false,
        message: "Only candidates can delete their resumes.",
      });
    }

    const {resumeId} = req.params;

    if (!mongoose.isValidObjectId(resumeId)) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Invalid resume ID.",
      });
    }

    const resume = await Resume.findOne({
      _id: resumeId,
      candidate: req.user._id,
    });

    if (!resume) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Resume not found.",
      });
    }

    const hasApplications = await Application.exists({resume: resume._id});
    if (hasApplications) {
      return res.status(httpStatus.CONFLICT).json({
        success: false,
        message: "This resume is attached to an application and cannot be deleted.",
      });
    }

    await deleteResumeFromCloudinary(resume.file.storageKey);
    await resume.deleteOne();

    return res.status(httpStatus.OK).json({
      success: true,
      message: "Resume deleted successfully.",
    });
  } catch (error) {
    return next(error);
  }
};


export const viewResume = async (req, res, next) => {
  try {
    const {
      resumeId: requestedResumeId,
      applicationId: routeApplicationId,
    } = req.params;
    const { applicationId: queryApplicationId } = req.query;
    const applicationId = routeApplicationId || queryApplicationId;
    let resumeId = requestedResumeId;
    let resume;

    if (routeApplicationId || (!resumeId && applicationId)) {
      if (!mongoose.isValidObjectId(applicationId)) {
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: "Invalid application ID.",
        });
      }

      const application = await Application.findById(applicationId)
        .select("resume job")
        .populate({
          path: "resume",
          select: "candidate file",
        })
        .lean();

      if (!application) {
        return res.status(httpStatus.NOT_FOUND).json({
          success: false,
          message: "Application not found.",
        });
      }

      if (req.user.role !== "recruiter") {
        return res.status(httpStatus.FORBIDDEN).json({
          success: false,
          message: "Only the job's recruiter can view this application resume.",
        });
      }

      const job = await Job.findOne({
        _id: application.job,
        recruiter: req.user._id,
      })
        .select("_id")
        .lean();

      if (!job) {
        return res.status(httpStatus.FORBIDDEN).json({
          success: false,
          message: "You are not authorized to view this resume.",
        });
      }

      if (!application.resume) {
        return res.status(httpStatus.NOT_FOUND).json({
          success: false,
          message: "The resume attached to this application no longer exists.",
        });
      }

      resume = application.resume;
      resumeId = resume._id.toString();
    }

    if (!mongoose.isValidObjectId(resumeId)) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Invalid resume ID.",
      });
    }

    // 2. Find resume
    if (!resume) {
      resume = await Resume.findById(resumeId)
        .select("candidate file")
        .lean();
    }

    if (!resume) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Resume not found.",
      });
    }

    let isAuthorized = false;

    if (req.user.role === "candidate") {
      isAuthorized =
        resume.candidate.toString() === req.user._id.toString();
    }

    if (req.user.role === "recruiter") {
      if (!mongoose.isValidObjectId(applicationId)) {
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: "A valid application ID is required.",
        });
      }

      const application = await Application.findOne({
        _id: applicationId,
        resume: resume._id,
      })
        .select("job")
        .lean();

      if (application) {
        const job = await Job.findOne({
          _id: application.job,
          recruiter: req.user._id,
        })
          .select("_id")
          .lean();

        isAuthorized = Boolean(job);
      }
    }

    if (!isAuthorized) {
      return res.status(httpStatus.FORBIDDEN).json({
        success: false,
        message: "You are not authorized to view this resume.",
      });
    }

    if (!resume.file?.storageKey) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Resume file not found in storage.",
      });
    }

    const format = resume.file.originalName.split(".").pop().toLowerCase();
    const downloadUrl = cloudinary.utils.private_download_url(
      resume.file.storageKey,
      format,
      {
        resource_type: "raw",
        type: "authenticated",
        expires_at: Math.floor(Date.now() / 1000) + 60,
      },
    );
    const downloadResponse = await fetch(downloadUrl);

    if (!downloadResponse.ok) {
      return res.status(httpStatus.BAD_GATEWAY).json({
        success: false,
        message: "Unable to retrieve resume from storage.",
      });
    }

    const fileBuffer = Buffer.from(await downloadResponse.arrayBuffer());

    res.set("X-Content-Type-Options", "nosniff");
    res.set(
      "Content-Security-Policy",
      "default-src 'none'; style-src 'unsafe-inline'; img-src data:",
    );
    res.set("Cache-Control", "private, no-store");

    if (resume.file.mimeType === "application/pdf") {
      return res
        .status(httpStatus.OK)
        .type("application/pdf")
        .set("Content-Disposition", 'inline; filename="resume.pdf"')
        .send(fileBuffer);
    }

    if (
      resume.file.mimeType !==
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return res.status(httpStatus.UNSUPPORTED_MEDIA_TYPE).json({
        success: false,
        message: "Unsupported resume file type.",
      });
    }

    const { value: documentHtml } = await mammoth.convertToHtml({
      buffer: fileBuffer,
    });
    const safeHtml = sanitizeHtml(documentHtml, {
      allowedTags: [
        "a", "blockquote", "br", "em", "h1", "h2", "h3", "h4", "h5", "h6",
        "li", "ol", "p", "strong", "table", "tbody", "td", "th", "thead",
        "tr", "ul",
      ],
      allowedAttributes: {
        a: ["href"],
      },
      allowedSchemes: ["http", "https", "mailto"],
    });
    const previewHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Resume Preview</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #0f172a;
              max-width: 900px;
              margin: 30px auto;
              padding: 20px;
            }
            img { max-width: 100%; }
            table {
              border-collapse: collapse;
              width: 100%;
            }
            td, th {
              border: 1px solid #cbd5e1;
              padding: 8px;
            }
          </style>
        </head>
        <body>${safeHtml}</body>
      </html>
    `;

    return res
      .status(httpStatus.OK)
      .type("html")
      .set(
        "Content-Disposition",
        'inline; filename="resume-preview.html"',
      )
      .send(previewHtml);

  } catch (error) {
    next(error);
  }
};
