import { Router } from "express";
import {
  createProjectController,
  manageEscrowProjectController,
  makeProjectEscrowController,
  fetchAllContributorsController,
  fetchRecentlyAddedContributorsController,
  fetchUserOwnedProjectsController,
  fetchUserContributorProjectsController,
  fetchGeneralContributorsController,
  fetchRecentGeneralContributorsController,
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

router.get("/contributors", asyncHandler(fetchGeneralContributorsController));
router.get(
  "/contributors/recent",
  asyncHandler(fetchRecentGeneralContributorsController)
);
router.get(
  "/:projectId/contributors",
  asyncHandler(fetchAllContributorsController)
);

router.get(
  "/:projectId/contributors/recent",
  asyncHandler(fetchRecentlyAddedContributorsController)
);

router.get("/", asyncHandler(fetchUserOwnedProjectsController));

router.get(
  "/contributing",
  asyncHandler(fetchUserContributorProjectsController)
);

export const projectRouter = router;
