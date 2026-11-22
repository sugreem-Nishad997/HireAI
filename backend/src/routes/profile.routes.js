import {Router} from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  deleteMyAccount,
  deleteMyProfile,
  getMyProfile,
  updateMyAccount,
  updateMyProfile,
} from "../controllers/profile.controller.js";

const router = Router();

router.get("/profile", authMiddleware, getMyProfile);
router.patch("/profile", authMiddleware, updateMyProfile);
router.patch("/profile/account", authMiddleware, updateMyAccount);
router.delete("/profile", authMiddleware, deleteMyProfile);
router.delete("/profile/account", authMiddleware, deleteMyAccount);

export default router;
