import { Router } from "express";
import {
  getProfileController,
  updateProfileController,
  updateProfilePhotoController,
  removeProfilePhotoController,
} from "@controllers/profile.controller";
import { protect } from "@middlewares/auth.middleware";
import asyncHandler from "@utils/asyncHandler";
const router = Router();

router.use(protect);
router.get("/", asyncHandler(getProfileController));

router.post("/", asyncHandler(updateProfileController));
router.patch("/photo", asyncHandler(updateProfilePhotoController));

router.delete("/photo", asyncHandler(removeProfilePhotoController));
export default router;
