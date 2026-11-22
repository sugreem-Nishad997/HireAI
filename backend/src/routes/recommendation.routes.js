
import { Router } from "express";

import authMiddleware from "../middleware/auth.middleware.js";

import {
    getRecommendedJobs,
    refreshRecommendations,
    getRecommendationStatus,
    getRecommendedJobDetails,
} from "../controllers/recommendation.controller.js";

const router = Router();

// All recommendation routes require authentication.
router.use(authMiddleware);

// Static routes must come before /:jobId.
router.get("/", getRecommendedJobs);

router.post("/refresh", refreshRecommendations);

router.get("/status", getRecommendationStatus);

router.get("/:jobId", getRecommendedJobDetails);

export default router;
