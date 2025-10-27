import express from "express";
import {
  createMilestoneWithFiles,
  fetchMilestones,
  manageMilestoneWithFiles,
} from "@controllers/project.milestone.controller";
import { protect } from "@middlewares/auth.middleware";
import asyncHandler from "@utils/asyncHandler";
const router = express.Router();
router.use(protect);

router.get("/:projectId", asyncHandler(fetchMilestones));
router.patch("/:projectId/create", asyncHandler(createMilestoneWithFiles));
router.patch("/:projectId/manage", asyncHandler(manageMilestoneWithFiles));

export const milestonesRouter = router;
