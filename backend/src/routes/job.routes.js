import {Router} from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  createJob,
  deactivateJob,
  getJobById,
  listJobs,
  updateJob,
} from "../controllers/job.controller.js";
import {
  getMySavedJobs,
  saveJob,
  unsaveJob,
} from "../controllers/savedJob.controller.js";

const router = Router();

router.get("/saved/mine", authMiddleware, getMySavedJobs);
router.put("/:jobId/saved", authMiddleware, saveJob);
router.delete("/:jobId/saved", authMiddleware, unsaveJob);
router.get("/", authMiddleware, listJobs);
router.get("/:jobId", authMiddleware, getJobById);
router.post("/", authMiddleware, createJob);
router.patch("/:jobId", authMiddleware, updateJob);
router.delete("/:jobId", authMiddleware, deactivateJob);

export default router;
