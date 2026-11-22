import httpStatus from "http-status";
import jsonwebtoken from "jsonwebtoken";
import User from "../models/User.js";

const unauthorized = (res, message) =>
  res.status(httpStatus.UNAUTHORIZED).json({
    success: false,
    message,
  });

const authMiddleware = async (req, res, next) => {
  const authorization = req.get("authorization");
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    return unauthorized(res, "Authentication required.");
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return next(new Error("JWT_SECRET is not configured."));
  }

  let payload;
  try {
    payload = jsonwebtoken.verify(match[1], secret);
  } catch (error) {
    if (
      error instanceof jsonwebtoken.TokenExpiredError ||
      error instanceof jsonwebtoken.JsonWebTokenError
    ) {
      return unauthorized(res, "Invalid or expired token.");
    }

    return next(error);
  }

  if (
    typeof payload === "string" ||
    typeof payload.id !== "string" ||
    !/^[a-f\d]{24}$/i.test(payload.id)
  ) {
    return unauthorized(res, "Invalid or expired token.");
  }

  try {
    const user = await User.findById(payload.id).select("_id name email role");

    if (!user) {
      return unauthorized(res, "Invalid or expired token.");
    }

    req.user = user;
    return next();

  } catch (error) {
    return next(error);
  }
};

export default authMiddleware;
export { authMiddleware };