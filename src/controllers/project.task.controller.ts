import { Request, Response } from "express";
import * as taskService from "../services/project.task.service";
import {
  ManageTasksInput,
  FetchTasksInput,
  TaskUpdateItem,
  GalleryItemCreateInput,
} from "../services/project.task.service";
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
export const manageTasks = async (req: Request, res: Response) => {
  try {
    const { projectId, milestoneId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Authentication required (User ID missing)." });
    }

    const body = req.body;
    const files = req.files as unknown as FileGroups;

    const rawItem = body as Record<string, any>;
    console.log("Raw Item:", rawItem);
    const item: TaskUpdateItem = {
      action: rawItem.action,
      id: rawItem.id,
      contributorId: rawItem.contributorId,
      title: rawItem.title,
      priority: rawItem.priority,
      dueDate: rawItem.dueDate,
      description: rawItem.description,
      percentageOfProject: rawItem.percentageOfProject,
      percentageToRelease: rawItem.percentageToRelease,
      releaseDate: rawItem.releaseDate,
    };

    if (!item.action || (item.action !== "create" && !item.id)) {
      return res
        .status(400)
        .json({ message: "Action and Task ID are required." });
    }

    if (item.action === "delete" && (files.image || files.file)) {
      return res
        .status(400)
        .json({ message: "Cannot upload files when deleting a task." });
    }

    let processedGalleryItems: GalleryItemCreateInput[] = [];

    if (item.action === "create" || item.action === "update") {
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

    const percentageOfProject = item.percentageOfProject
      ? parseFloat(item.percentageOfProject as unknown as string)
      : undefined;
    const percentageToRelease = item.percentageToRelease
      ? parseFloat(item.percentageToRelease as unknown as string)
      : undefined;
    const dueDate = item.dueDate
      ? new Date(item.dueDate as unknown as string)
      : undefined;
    const releaseDate = item.releaseDate
      ? new Date(item.releaseDate as unknown as string)
      : undefined;

    const serviceTaskItem: TaskUpdateItem = {
      action: item.action,
      id: item.id,
      contributorId: item.contributorId,
      title: item.title,
      priority: item.priority,
      dueDate: dueDate,
      description: item.description,
      percentageOfProject: percentageOfProject,
      percentageToRelease: percentageToRelease,
      releaseDate: releaseDate,
      galleryItemsToCreate: processedGalleryItems,
    };

    if (
      item.action === "create" &&
      (!serviceTaskItem.contributorId ||
        !serviceTaskItem.title ||
        serviceTaskItem.percentageOfProject === undefined ||
        isNaN(serviceTaskItem.percentageOfProject) ||
        serviceTaskItem.percentageToRelease === undefined ||
        isNaN(serviceTaskItem.percentageToRelease) ||
        !serviceTaskItem.dueDate ||
        isNaN(serviceTaskItem.dueDate.getTime()))
    ) {
      return res.status(400).json({
        message:
          "Missing required fields for CREATE: contributorId, title, percentageOfProject, percentageToRelease, or dueDate.",
      });
    }

    const serviceInput: ManageTasksInput = {
      projectId: projectId,
      milestoneId: milestoneId,
      userId: userId,
      tasks: [serviceTaskItem],
    };

    const updatedMilestone = await taskService.createMilestoneTasks(
      serviceInput
    );

    const statusCode =
      item.action === "create" ? 201 : item.action === "delete" ? 204 : 200;

    if (item.action === "delete") {
      return res.status(statusCode).send();
    }

    const updatedTask = updatedMilestone.tasks.find(
      (t) => t.id === serviceTaskItem.id || t.title === serviceTaskItem.title
    );

    return res.status(statusCode).json(updatedTask);
  } catch (err) {
    const error = err as Error;

    if (error instanceof Error) {
      if (
        error.message.includes("required") ||
        error.message.includes("exactly one")
      ) {
        return res.status(400).json({ message: error.message });
      }
      if (
        error.message.includes("Milestone not found") ||
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

    return res.status(500).json({
      message: "An unexpected error occurred during task processing.",
      error: error.message,
    });
  }
};
export async function deleteTask(req: Request, res: Response): Promise<void> {
  const { projectId, milestoneId, taskId } = req.params;
  const userId = (req as any).user.id;

  try {
    await taskService.deleteMilestoneTask(
      milestoneId,
      taskId,
      projectId,
      userId
    );

    res.status(200).json({
      message: "Task successfully deleted.",
      taskId,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete task.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function fetchTasks(req: Request, res: Response): Promise<void> {
  const { milestoneId } = req.params;

  const input: FetchTasksInput = { milestoneId };

  try {
    const milestoneWithTasks = await taskService.fetchMilestoneTasks(input);

    res.status(200).json({
      milestone: milestoneWithTasks.id,
      tasks: milestoneWithTasks.tasks,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch tasks.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
