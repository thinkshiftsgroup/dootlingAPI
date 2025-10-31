import { Request, Response, NextFunction } from "express";
import * as projectService from "@services/project.service";
import { Prisma } from "@prisma/client";

import { uploadMultipleToCloudinary } from "../utils/cloudinary";

export type MulterFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
};

export interface FileGroups {
  image?: MulterFile[];
  file?: MulterFile[];
}

const handleServiceError = (res: Response, error: unknown) => {
  if (error instanceof Error) {
    if (error.message.includes("Project not found")) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes("Failed to create project")) {
      return res.status(400).json({ message: error.message });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003" || error.code === "P2025") {
        return res.status(400).json({
          message: "Invalid data provided (e.g., non-existent user ID).",
        });
      }
    }
    return res.status(500).json({
      message: "An unexpected server error occurred.",
      detail: error.message,
    });
  }
  return res.status(500).json({ message: "An unknown server error occurred." });
};

export const createProjectController = async (req: Request, res: Response) => {
  const { title, description } = req.body;

  if (title == null || description == null || req.body.isPublic == null) {
    return res.status(400).json({
      message:
        "Missing required project fields: title, description, or isPublic.",
    });
  }

  try {
    const ownerId = (req as any).user?.id as string;

    const isPublic = req.body.isPublic === "true";

    let contributorIds: string[] | undefined;
    if (req.body.contributorIds) {
      try {
        contributorIds = JSON.parse(
          req.body.contributorIds as string
        ) as string[];
      } catch (e) {
        return res.status(400).json({
          message:
            "Invalid format for contributorIds. Expected a JSON array string.",
        });
      }
    }

    const files = (req.files as FileGroups) || {};
    const rawImages = files.image || [];

    let projectImageUrl: string | undefined;

    if (rawImages.length > 0) {
      const primaryImage: MulterFile = rawImages[0];

      const uploadedUrls = await uploadMultipleToCloudinary([primaryImage]);

      if (uploadedUrls.length > 0) {
        projectImageUrl = uploadedUrls[0];
      }
    }

    const newProject = await projectService.createProject({
      ownerId,
      title,
      description,
      isPublic,
      contributorIds,
      projectImageUrl: projectImageUrl,
    });

    return res.status(201).json({
      message: "Project created successfully.",
      data: newProject,
    });
  } catch (error) {
    const err = error as Error;

    if (
      err.message.includes("Cloudinary") ||
      err.message.includes("Failed to upload")
    ) {
      return res.status(500).json({ message: `Upload error: ${err.message}` });
    }

    console.error("Create Project Controller Error:", err);

    return res.status(500).json({
      message: "An unexpected error occurred during project creation.",
    });
  }
};

export const getProjectDetailsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectId as string;

    if (!projectId) {
      return res.status(400).json({ message: "Project ID is required." });
    }

    const projectDetails = await projectService.getProjectDetails(projectId);

    return res.status(200).json({
      message: "Project details fetched successfully.",
      data: projectDetails,
    });
  } catch (error) {
    handleServiceError(res, error);
  }
};

export const makeProjectEscrowController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { projectId } = req.params;

  try {
    const updatedProject = await projectService.makeProjectEscrow({
      projectId,
    });

    return res.status(200).json({
      message: "Project successfully marked as escrow-enabled.",
      project: updatedProject,
    });
  } catch (error) {
    handleServiceError(res, error);
  }
};
export const manageEscrowProjectController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { projectId } = req.params;
  const updateData = req.body;

  try {
    const files = (req.files as FileGroups) || {};
    const rawImages = files.image || [];

    let projectImageUrl: string | undefined;

    if (rawImages.length > 0) {
      const primaryImage: MulterFile = rawImages[0];

      const uploadedUrls = await uploadMultipleToCloudinary([primaryImage]);

      if (uploadedUrls.length > 0) {
        projectImageUrl = uploadedUrls[0];
        updateData.projectImageUrl = projectImageUrl;
      }
    }

    if (updateData.hasOwnProperty("isPublic")) {
      updateData.isPublic =
        updateData.isPublic === "true" || updateData.isPublic === 1;
    }

    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ message: "No fields provided for update." });
    }

    const updatedProject = await projectService.manageEscrowProject({
      projectId,
      ...updateData,
    });

    return res.status(200).json({
      message: "Project escrow details updated successfully.",
      project: updatedProject,
    });
  } catch (error) {
    const err = error as Error;

    if (
      err.message.includes("Cloudinary") ||
      err.message.includes("Failed to upload")
    ) {
      return res.status(500).json({ message: `Upload error: ${err.message}` });
    }

    handleServiceError(res, error);
  }
};
export const fetchGeneralContributorsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const ownerId = (req as any).user?.id as string;

  if (!ownerId) {
    return res.status(400).json({ message: "Owner ID is required." });
  }

  try {
    const contributors = await projectService.fetchGeneralContributors(ownerId);
    return res
      .status(200)
      .json({ message: "Contributors fetched successfully.", contributors });
  } catch (error) {
    handleServiceError(res, error);
  }
};

export const fetchRecentGeneralContributorsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const ownerId = (req as any).user?.id as string;
  const limit = parseInt(req.query.limit as string) || 5;

  if (!ownerId) {
    return res.status(400).json({ message: "Owner ID is required." });
  }
  if (limit <= 0) {
    return res
      .status(400)
      .json({ message: "Limit must be a positive number." });
  }

  try {
    const contributors = await projectService.fetchRecentGeneralContributors(
      ownerId,
      limit
    );
    return res.status(200).json({
      message: "Recent Contributors fetched successfully.",
      contributors,
    });
  } catch (error) {
    handleServiceError(res, error);
  }
};

export const fetchAllContributorsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { projectId } = req.params;

  try {
    const contributors = await projectService.fetchAllContributors(projectId);
    return res
      .status(200)
      .json({ message: "Contributors fetched successfully.", contributors });
  } catch (error) {
    handleServiceError(res, error);
  }
};

export const fetchRecentlyAddedContributorsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { projectId } = req.params;
  const limit = parseInt(req.query.limit as string) || 5;

  try {
    const contributors = await projectService.fetchRecentlyAddedContributors(
      projectId,
      limit
    );
    return res
      .status(200)
      .json({ message: "Contributors fetched successfully.", contributors });
  } catch (error) {
    handleServiceError(res, error);
  }
};

export const fetchUserOwnedProjectsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = (req as any).user?.id as string;

  try {
    const projects = await projectService.fetchUserOwnedProjects(userId);
    return res
      .status(200)
      .json({ message: "Projects fetched successfully.", data: projects });
  } catch (error) {
    handleServiceError(res, error);
  }
};

export const fetchUserContributorProjectsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = (req as any).user?.id as string;

  try {
    const projects = await projectService.fetchUserContributorProjects(userId);
    return res
      .status(200)
      .json({ message: "Projects fetched successfully.", data: projects });
  } catch (error) {
    handleServiceError(res, error);
  }
};
