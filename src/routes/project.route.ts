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
  getProjectDetailsController,
} from "@controllers/project.controller";
import { protect } from "@middlewares/auth.middleware";
import asyncHandler from "@utils/asyncHandler";

const router = Router();
import multer from "multer";

router.use(protect);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const projectUploads = upload.fields([
  { name: "image", maxCount: 10 },
  { name: "file", maxCount: 20 },
]);

router.use(protect);
router.post("/", projectUploads, asyncHandler(createProjectController));

router.patch(
  "/:projectId/manage",
  projectUploads,
  asyncHandler(manageEscrowProjectController)
);

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
router.get("/:projectId/details", asyncHandler(getProjectDetailsController));
router.get(
  "/contributing",
  asyncHandler(fetchUserContributorProjectsController)
);

export const projectRouter = router;
