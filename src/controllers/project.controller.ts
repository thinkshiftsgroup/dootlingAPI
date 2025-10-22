import { Request, Response, NextFunction } from "express";
import * as projectService from "@services/project.service";
import { Prisma } from "@prisma/client";

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
        return res
          .status(400)
          .json({
            message: "Invalid data provided (e.g., non-existent user ID).",
          });
      }
    }
    return res
      .status(500)
      .json({
        message: "An unexpected server error occurred.",
        detail: error.message,
      });
  }
  return res.status(500).json({ message: "An unknown server error occurred." });
};

export const createProjectController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    ownerId,
    title,
    description,
    isPublic,
    contributorIds,
    totalBudget,
    startDate,
    deliveryDate,
    contractClauses,
    fundsRule,
  } = req.body;

  if (
    !ownerId ||
    !title ||
    !totalBudget ||
    !startDate ||
    !deliveryDate ||
    !contractClauses
  ) {
    return res
      .status(400)
      .json({ message: "Missing required project and escrow fields." });
  }

  try {
    const newProject = await projectService.createProject({
      ownerId,
      title,
      description,
      isPublic,
      contributorIds,
      totalBudget,
      startDate: new Date(startDate),
      deliveryDate: new Date(deliveryDate),
      contractClauses,
      fundsRule,
    });

    return res.status(201).json(newProject);
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

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ message: "No fields provided for update." });
  }

  try {
    const updatedProject = await projectService.manageEscrowProject({
      projectId,
      ...updateData,
    });
    return res.status(200).json(updatedProject);
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
    return res.status(200).json(contributors);
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
    return res.status(200).json(contributors);
  } catch (error) {
    handleServiceError(res, error);
  }
};

export const fetchUserOwnedProjectsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.params;

  try {
    const projects = await projectService.fetchUserOwnedProjects(userId);
    return res.status(200).json(projects);
  } catch (error) {
    handleServiceError(res, error);
  }
};

export const fetchUserContributorProjectsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.params;

  try {
    const projects = await projectService.fetchUserContributorProjects(userId);
    return res.status(200).json(projects);
  } catch (error) {
    handleServiceError(res, error);
  }
};
