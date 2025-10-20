import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import asyncHandler from "../utils/asyncHandler";

const router = Router();

router.post("/signup", asyncHandler(authController.signUp));
router.post("/verify-email", asyncHandler(authController.verifyEmail));
router.post(
  "/resend-verification",
  asyncHandler(authController.resendVerificationCode)
);

router.post("/signin", asyncHandler(authController.signIn));
router.post("/forgot-password", asyncHandler(authController.forgotPassword));
router.post("/reset-password", asyncHandler(authController.resetPassword));

export const authRouter = router;
