import express from "express";
import {
  manageTasks,
  deleteTask,
  fetchTasks,
} from "@controllers/project.task.controller";
import { protect } from "@middlewares/auth.middleware";
import asyncHandler from "@utils/asyncHandler";
import multer from "multer";

const router = express.Router();
router.use(protect);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const taskUploads = upload.fields([
  { name: "image", maxCount: 10 },
  { name: "file", maxCount: 20 },
]);
router.get("/milestones/:milestoneId", asyncHandler(fetchTasks));

router.post(
  "/projects/:projectId/milestones/:milestoneId",
  taskUploads,
  asyncHandler(manageTasks)
);

router.delete(
  "/projects/:projectId/milestones/:milestoneId/tasks/:taskId",
  asyncHandler(deleteTask)
);

export const tasksRouter = router;
