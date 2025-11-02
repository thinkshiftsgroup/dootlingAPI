import { Router } from "express";
import {
  getUserProfileController,
  getPublicProfileByUsernameController,
} from "@controllers/user.controller";

import asyncHandler from "@utils/asyncHandler";
const router = Router();

router.get("/:userId", asyncHandler(getUserProfileController));
router.get(
  "/username/:username",
  asyncHandler(getPublicProfileByUsernameController)
);

export const userRouter = router;
