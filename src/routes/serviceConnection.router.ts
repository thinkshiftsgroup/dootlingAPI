import { Router } from "express";
import { githubController } from "@controllers/serviceConnection.controller";
import { protect } from "@middlewares/auth.middleware";
import asyncHandler from "@utils/asyncHandler";

const router = Router();
router.use(protect);

router.get("/github", asyncHandler(githubController.redirectToAuth));
router.get(
  "/github/callback",

  asyncHandler(githubController.handleCallback)
);

export const connectionsRouter = router;
