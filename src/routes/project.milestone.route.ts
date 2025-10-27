import express from "express";
import { updateProjectMilestones } from "@controllers/project.milestone.controller";
import { protect } from "@middlewares/auth.middleware";
import asyncHandler from "@utils/asyncHandler";
const router = express.Router();
router.use(protect);

router.patch("/:projectId/milestones", asyncHandler(updateProjectMilestones));

export const milestonesRouter = router;
