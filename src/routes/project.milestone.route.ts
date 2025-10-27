import express from "express";
import {
  createMilestoneWithFiles,
  fetchMilestones,
  manageMilestoneWithFiles,
} from "@controllers/project.milestone.controller";
import { protect } from "@middlewares/auth.middleware";
import asyncHandler from "@utils/asyncHandler";
import multer from "multer";
const router = express.Router();
router.use(protect);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const milestoneUploads = upload.fields([
  { name: "image", maxCount: 10 },
  { name: "file", maxCount: 20 },
]);

router.get("/:projectId", asyncHandler(fetchMilestones));
router.post(
  "/:projectId/create",
  milestoneUploads,
  asyncHandler(createMilestoneWithFiles)
);
router.patch(
  "/:projectId/manage",
  milestoneUploads,
  asyncHandler(manageMilestoneWithFiles)
);

export const milestonesRouter = router;
