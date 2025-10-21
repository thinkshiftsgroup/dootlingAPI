import { Router } from "express";
import { followsController } from "@controllers/follows.controller";
import { protect } from "@middlewares/auth.middleware";
import asyncHandler from "@utils/asyncHandler";
const router = Router();

router.use(protect);

router.get("/find", asyncHandler(followsController.getUsers));
router.post("/:followingId", asyncHandler(followsController.follow));
router.delete("/:followingId", asyncHandler(followsController.unfollow));

router.get("/followers", asyncHandler(followsController.getFollowers));
router.get("/following", asyncHandler(followsController.getFollowing));

export const followsRouter = router;
