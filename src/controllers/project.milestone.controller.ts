import { Request, Response } from "express";
import {
  manageProjectMilestones,
  ManageMilestonesInput,
  MilestoneUpdateItem,
  GalleryItemCreateInput,
  fetchProjectMilestones,
  createProjectMilestones,
  ProjectWithMilestones,
} from "@services/project.milestone.service";
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

export interface FlatMilestoneBody {
  title: string;
  releasePercentage: string;
  releaseDate: string;
  dueDate: string;
  description?: string;
}

export const fetchMilestones = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string;

    const project: ProjectWithMilestones = await fetchProjectMilestones({
      projectId,
    });

    return res.status(200).json(project.milestones);
  } catch (error) {
    const err = error as Error;

    if (
      err.message.includes("Project not found") ||
      err.message.includes("Related record")
    ) {
      return res.status(404).json({ message: err.message });
    }

    console.error("Fetch Controller Error:", err);
    return res.status(500).json({
      message: "An unexpected error occurred during milestone fetching.",
    });
  }
};
export const createMilestoneWithFiles = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string;
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Authentication required (User ID missing)." });
    }

    const body = req.body as FlatMilestoneBody;

    const files = (req.files as FileGroups) || {};

    const rawImages = files.image || [];
    const rawFiles = files.file || [];
    const allRawFiles: MulterFile[] = [...rawImages, ...rawFiles];

    let processedGalleryItems: GalleryItemCreateInput[] = [];

    if (allRawFiles.length > 0) {
      const fileTypes: string[] = allRawFiles.map((item) => item.mimetype);
      const uploadedUrls = await uploadMultipleToCloudinary(allRawFiles);

      processedGalleryItems = uploadedUrls.map((url, index) => ({
        url: url,
        fileType: fileTypes[index],
      }));
    }

    const releasePercentage = parseInt(body.releasePercentage, 10);
    const releaseDate = body.releaseDate
      ? new Date(body.releaseDate)
      : undefined;
    const dueDate = body.dueDate ? new Date(body.dueDate) : undefined;

    const serviceMilestoneItem: MilestoneUpdateItem = {
      action: "create",
      title: body.title,
      releasePercentage: releasePercentage,
      releaseDate: releaseDate,
      dueDate: dueDate,
      description: body.description,
      galleryItemsToCreate: processedGalleryItems,
    };

    if (
      !serviceMilestoneItem.title ||
      isNaN(releasePercentage) ||
      !dueDate ||
      isNaN(dueDate.getTime())
    ) {
      return res.status(400).json({
        message:
          "Missing required fields or invalid format for: title, releasePercentage, or dueDate.",
      });
    }

    const serviceInput: ManageMilestonesInput = {
      projectId: projectId,
      userId: userId,
      milestones: [serviceMilestoneItem],
    };

    const updatedProject = await createProjectMilestones(serviceInput);

    const createdMilestone =
      updatedProject.milestones.find(
        (m) => m.title === serviceMilestoneItem.title
      ) || updatedProject.milestones.slice(-1)[0];

    return res.status(201).json(createdMilestone);
  } catch (err) {
    const error = err as Error;

    if (error instanceof Error) {
      if (
        error.message.includes("requires") ||
        error.message.includes("must contain exactly one")
      ) {
        return res.status(400).json({ message: error.message });
      }
      if (
        error.message.includes("Project not found") ||
        error.message.includes("Related record")
      ) {
        return res.status(404).json({ message: error.message });
      }
      if (
        error.message.includes("Cloudinary") ||
        error.message.includes("Failed to upload")
      ) {
        return res
          .status(500)
          .json({ message: `Upload error: ${error.message}` });
      }
    }

    console.error("Controller Error:", error);
    return res.status(500).json({
      message: "An unexpected error occurred during milestone creation.",
    });
  }
};

export const manageMilestoneWithFiles = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string;
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Authentication required (User ID missing)." });
    }

    const body = req.body;
    const files = req.files as { image?: MulterFile[]; file?: MulterFile[] };

    if (!body.action || (body.action !== "create" && !body.id)) {
      return res
        .status(400)
        .json({ message: "Action and Milestone ID are required." });
    }

    if (body.action === "delete" && (files.image || files.file)) {
      return res
        .status(400)
        .json({ message: "Cannot upload files when deleting a milestone." });
    }

    let processedGalleryItems: GalleryItemCreateInput[] = [];

    if (body.action === "create" || body.action === "update") {
      const rawImages = files.image || [];
      const rawFiles = files.file || [];
      const allRawFiles: MulterFile[] = [...rawImages, ...rawFiles];

      if (allRawFiles.length > 0) {
        const fileTypes: string[] = allRawFiles.map((item) => item.mimetype);
        const uploadedUrls = await uploadMultipleToCloudinary(allRawFiles);
        processedGalleryItems = uploadedUrls.map((url, index) => ({
          url: url,
          fileType: fileTypes[index],
        }));
      }
    }

    const releasePercentage = body.releasePercentage
      ? parseInt(body.releasePercentage, 10)
      : undefined;
    const dueDate = body.dueDate ? new Date(body.dueDate) : undefined;
    const releaseDate = body.releaseDate
      ? new Date(body.releaseDate)
      : undefined;

    const serviceMilestoneItem: MilestoneUpdateItem = {
      action: body.action,
      id: body.id,
      title: body.title,
      releasePercentage: releasePercentage,
      releaseDate: releaseDate,
      dueDate: dueDate,
      description: body.description,
      galleryItemsToCreate: processedGalleryItems,
    };

    if (
      body.action === "create" &&
      (!serviceMilestoneItem.title ||
        serviceMilestoneItem.releasePercentage === undefined ||
        isNaN(serviceMilestoneItem.releasePercentage) ||
        !serviceMilestoneItem.dueDate ||
        isNaN(serviceMilestoneItem.dueDate.getTime()))
    ) {
      return res.status(400).json({
        message:
          "Missing required fields for CREATE: title, releasePercentage, or dueDate.",
      });
    }

    const serviceInput: ManageMilestonesInput = {
      projectId: projectId,
      userId: userId,
      milestones: [serviceMilestoneItem],
    };

    const updatedProject = await manageProjectMilestones(serviceInput);

    const statusCode =
      body.action === "create" ? 201 : body.action === "delete" ? 204 : 200;

    if (body.action === "delete") {
      return res.status(statusCode).send();
    }

    // ⭐ Find the updated/created milestone for return.
    // If 'create', the newly created milestone is usually the last one in the returned list.
    // If 'update', search by ID first, then by title as a fallback.
    const returnedMilestone =
      updatedProject.milestones.find((m) => m.id === serviceMilestoneItem.id) ||
      (body.action === "create" && updatedProject.milestones.slice(-1)[0]) ||
      updatedProject.milestones.find(
        (m) => m.title === serviceMilestoneItem.title
      );

    if (returnedMilestone) {
      return res.status(statusCode).json(returnedMilestone);
    } else {
      // Fallback for update/create action where the specific milestone couldn't be located
      return res.status(200).json(updatedProject);
    }
  } catch (err) {
    const error = err as Error;

    if (error instanceof Error) {
      if (
        error.message.includes("requires") ||
        error.message.includes("must contain exactly one")
      ) {
        return res.status(400).json({ message: error.message });
      }
      if (
        error.message.includes("Project not found") ||
        error.message.includes("Related record")
      ) {
        return res.status(404).json({ message: error.message });
      }
      if (
        error.message.includes("Cloudinary") ||
        error.message.includes("Failed to upload")
      ) {
        return res
          .status(500)
          .json({ message: `Upload error: ${error.message}` });
      }
    }

    console.error("Controller Error:", error);
    return res.status(500).json({
      message: "An unexpected error occurred during milestone processing.",
    });
  }
};
