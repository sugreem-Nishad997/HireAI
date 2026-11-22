import {Router} from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  applyToJob,
  getApplicationsForJob,
  getMyApplications,
  updateApplicationStatus,
} from "../controllers/application.controller.js";

const router = Router();

router.post("/jobs/:jobId", authMiddleware, applyToJob);
router.get("/mine", authMiddleware, getMyApplications);
router.get("/jobs/:jobId", authMiddleware, getApplicationsForJob);
router.patch("/:applicationId/status", authMiddleware, updateApplicationStatus);

export default router;
