import { Router } from "express";
import {
  getProfileController,
  updateProfileController,
} from "@controllers/profile.controller";
import { protect } from "@middlewares/auth.middleware";
import asyncHandler from "@utils/asyncHandler";
const router = Router();

router.use(protect);
router.get("/", asyncHandler(getProfileController));

router.post("/", asyncHandler(updateProfileController));

export default router;
