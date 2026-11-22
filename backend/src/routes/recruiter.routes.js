import {Router} from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {getRecruiterDashboard} from "../controllers/recruiter.controller.js";

const router = Router();

router.get("/dashboard", authMiddleware, getRecruiterDashboard);

export default router;