import { Router } from "express";
import { fetchPublicProjectsController } from "@controllers/home.controller";
import asyncHandler from "@utils/asyncHandler";
const router = Router();

// GET /api/home/projects?limit=10&skip=0
router.get("/projects", asyncHandler(fetchPublicProjectsController));

export const homeRouter = router;
