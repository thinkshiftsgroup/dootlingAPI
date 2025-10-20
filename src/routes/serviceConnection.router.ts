import { Router } from "express";
import { githubController } from "@controllers/serviceConnection.controller";
import { protect } from "@middlewares/auth.middleware";
import asyncHandler from "@utils/asyncHandler";
const router = Router();

router.get("/github", protect, asyncHandler(githubController.redirectToAuth));
router.get(
  "/github/callback",
  protect,
  asyncHandler(githubController.handleCallback)
);

export const connectionsRouter = router;
