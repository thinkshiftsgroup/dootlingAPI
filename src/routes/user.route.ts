import { Router } from "express";
import { getUserProfileController } from "@controllers/user.controller";

import asyncHandler from "@utils/asyncHandler";
const router = Router();

router.get("/:userId", asyncHandler(getUserProfileController));

export const userRouter = router;
