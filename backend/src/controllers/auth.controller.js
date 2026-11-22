import User from "../models/User.js";
import Otp from "../models/Otp.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import httpStatus from "http-status";
import { createSecretToken } from "../utils/secretToken.js";
import { sendOtpEmail } from "../services/email.service.js";

dotenv.config();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendRegistrationOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "A valid email address is required.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(httpStatus.CONFLICT).json({
        success: false,
        message: "An account with this email already exists. Please sign in.",
      });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any previous registration OTPs for this email
    await Otp.deleteMany({ email: normalizedEmail, purpose: "registration" });

    // Store new OTP
    await Otp.create({
      email: normalizedEmail,
      otp,
      purpose: "registration",
      expiresAt,
    });

    try {
      await sendOtpEmail(normalizedEmail, otp, "registration");
    } catch (emailError) {
      console.error("Failed to send registration OTP email:", emailError);
      await Otp.deleteMany({ email: normalizedEmail, purpose: "registration" });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to send verification email. Please check your email and try again.",
      });
    }

    return res.status(httpStatus.OK).json({
      success: true,
      message: "Verification code sent to your email.",
    });
  } catch (err) {
    console.error("Error in sendRegistrationOtp:", err);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};

const verifyRegistrationOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Email and verification code are required.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      purpose: "registration",
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Verification code has expired or was not requested. Please request a new code.",
      });
    }

    if (otpRecord.otp !== otp.toString().trim()) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Incorrect verification code. Please check and try again.",
      });
    }

    otpRecord.verified = true;
    await otpRecord.save();

    return res.status(httpStatus.OK).json({
      success: true,
      message: "Email verified successfully.",
    });
  } catch (err) {
    console.error("Error in verifyRegistrationOtp:", err);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

const register = async (req, res) => {
  try {
    const { name, email, password, role = "candidate", otp } = req.body;

    if (!name || !email || !password) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "Name, email, and password are required.",
        success: false,
      });
    }

    if (!otp) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "Email verification code is required.",
        success: false,
      });
    }

    if (!["candidate", "recruiter"].includes(role)) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "Role must be candidate or recruiter.",
        success: false,
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(httpStatus.CONFLICT).json({
        message: "An account with this email already exists.",
        success: false,
      });
    }

    // Verify OTP
    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      purpose: "registration",
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "Verification code expired or not found. Please request a new code.",
        success: false,
      });
    }

    if (otpRecord.otp !== otp.toString().trim() && !otpRecord.verified) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "Incorrect verification code.",
        success: false,
      });
    }

    // Clean up OTPs after successful verification
    await Otp.deleteMany({ email: normalizedEmail, purpose: "registration" });

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      isEmailVerified: true,
    });

    await user.save();

    return res.status(httpStatus.CREATED).json({
      message: "User created successfully",
      success: true,
    });
  } catch (err) {
    console.error("Error in register:", err);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "All fields are required",
        success: false,
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (!existingUser) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "User not found",
        success: false,
      });
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);

    if (!isMatch) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Invalid credentials",
        success: false,
      });
    }

    const token = createSecretToken(existingUser._id);

    return res.status(httpStatus.OK).json({
      message: "Login successful",
      token,
      existingUser,
      success: true,
    });
  } catch (err) {
    console.error("Error in login:", err);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const sendForgotPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "A valid email address is required.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "No account found with this email address.",
      });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing forgot_password OTPs for this email
    await Otp.deleteMany({ email: normalizedEmail, purpose: "forgot_password" });

    // Store new OTP
    await Otp.create({
      email: normalizedEmail,
      otp,
      purpose: "forgot_password",
      expiresAt,
    });

    try {
      await sendOtpEmail(normalizedEmail, otp, "forgot_password");
    } catch (emailError) {
      console.error("Failed to send forgot password OTP email:", emailError);
      await Otp.deleteMany({ email: normalizedEmail, purpose: "forgot_password" });
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to send password reset email. Please try again later.",
      });
    }

    return res.status(httpStatus.OK).json({
      success: true,
      message: "Password reset code sent to your email.",
    });
  } catch (err) {
    console.error("Error in sendForgotPasswordOtp:", err);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};

const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Email and reset code are required.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      purpose: "forgot_password",
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Reset code has expired or was not requested. Please request a new code.",
      });
    }

    if (otpRecord.otp !== otp.toString().trim()) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Incorrect reset code. Please check and try again.",
      });
    }

    otpRecord.verified = true;
    await otpRecord.save();

    return res.status(httpStatus.OK).json({
      success: true,
      message: "Reset code verified successfully.",
    });
  } catch (err) {
    console.error("Error in verifyResetOtp:", err);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Email, reset code, and new password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "User not found.",
      });
    }

    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      purpose: "forgot_password",
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Reset code has expired. Please request a new reset code.",
      });
    }

    if (otpRecord.otp !== otp.toString().trim() && !otpRecord.verified) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Incorrect reset code.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    // Clean up OTP
    await Otp.deleteMany({ email: normalizedEmail, purpose: "forgot_password" });

    return res.status(httpStatus.OK).json({
      success: true,
      message: "Password reset successfully. You can now sign in with your new password.",
    });
  } catch (err) {
    console.error("Error in resetPassword:", err);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export {
  register,
  login,
  sendRegistrationOtp,
  verifyRegistrationOtp,
  sendForgotPasswordOtp,
  verifyResetOtp,
  resetPassword,
};
