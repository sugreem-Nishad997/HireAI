import {
  register,
  login,
  sendRegistrationOtp,
  verifyRegistrationOtp,
  sendForgotPasswordOtp,
  verifyResetOtp,
  resetPassword,
} from "../controllers/auth.controller.js";

import { Router } from "express";

const authRouter = Router();

authRouter.route("/auth/register").post(register);
authRouter.route("/auth/login").post(login);
authRouter.route("/auth/send-registration-otp").post(sendRegistrationOtp);
authRouter.route("/auth/verify-registration-otp").post(verifyRegistrationOtp);
authRouter.route("/auth/forgot-password").post(sendForgotPasswordOtp);
authRouter.route("/auth/verify-reset-otp").post(verifyResetOtp);
authRouter.route("/auth/reset-password").post(resetPassword);

export default authRouter;
