import {Router} from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {uploadResume} from "../middleware/upload.middleware.js";
import {
  deleteResumeController,
  getMyResumesController,
  getResumeController,
  uploadResumeController,
  viewResume,
} from "../controllers/resume.controller.js";

const router = Router();

// Route to handle resume upload
router.post("/resumes/upload", authMiddleware, uploadResume, uploadResumeController);
router.get("/resumes/mine", authMiddleware, getMyResumesController);
router.get("/resumes/view", authMiddleware, viewResume);
router.delete("/resumes/:resumeId", authMiddleware, deleteResumeController);
router.get("/resumes/:resumeId", authMiddleware, getResumeController);
router.get("/resumes/:resumeId/view", authMiddleware, viewResume);
export default router;