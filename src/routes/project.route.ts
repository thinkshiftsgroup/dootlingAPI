import { Router } from "express";
import {
  createProjectController,
  manageEscrowProjectController,
  makeProjectEscrowController,
  fetchAllContributorsController,
  fetchRecentlyAddedContributorsController,
  fetchUserOwnedProjectsController,
  fetchUserContributorProjectsController,
} from "@controllers/project.controller";
import { protect } from "@middlewares/auth.middleware";
import asyncHandler from "@utils/asyncHandler";

const router = Router();
router.use(protect);
router.post("/", asyncHandler(createProjectController));

router.patch("/:projectId/manage", asyncHandler(manageEscrowProjectController));

router.patch(
  "/:projectId/escrow-activate",
  asyncHandler(makeProjectEscrowController)
);

router.get(
  "/:projectId/contributors",
  asyncHandler(fetchAllContributorsController)
);

router.get(
  "/:projectId/contributors/recent",
  asyncHandler(fetchRecentlyAddedContributorsController)
);

router.get(
  "/users/:userId/projects/owned",
  asyncHandler(fetchUserOwnedProjectsController)
);

router.get(
  "/users/:userId/projects/contributing",
  asyncHandler(fetchUserContributorProjectsController)
);

export const projectRouter = router;
