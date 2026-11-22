import {Router} from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {matchCandidatesForJob} from "../controllers/candidateMatching.controller.js";

const router = Router();

router.post("/:jobId/match", authMiddleware,  matchCandidatesForJob
);

export default router;
