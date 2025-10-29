import {
  PrismaClient,
  Project,
  Milestone,
  Task,
  Prisma,
  GalleryItem,
} from "@prisma/client";

export type GalleryItemCreateInput = {
  url: string;
  fileType: string;
};

export type TaskUpdateItem = {
  id?: string;
  action: "create" | "update" | "delete";
  contributorId?: string;
  title?: string;
  priority?: string;
  dueDate?: Date;
  description?: string;
  percentageOfProject?: number;
  percentageToRelease?: number;
  releaseDate?: Date | null;
  galleryItemsToCreate?: GalleryItemCreateInput[];
};

export type ManageTasksInput = {
  projectId: string;
  milestoneId: string;
  userId: string;
  tasks: TaskUpdateItem[];
};

export type FetchTasksInput = {
  milestoneId: string;
};

export type MilestoneWithTasks = Milestone & {
  tasks: (Task & { galleryItems: GalleryItem[] })[];
};

const prisma = new PrismaClient();

function processTaskUpdates(
  items: TaskUpdateItem[],
  projectId: string,
  uploadedByUserId: string
): Prisma.MilestoneUpdateInput["tasks"] {
  const payload: Prisma.MilestoneUpdateInput["tasks"] = {};

  if (items.length !== 1) {
    throw new Error(
      "This service requires exactly one task item for processing."
    );
  }

  const item = items[0];

  if (item.action === "create") {
    if (
      !item.contributorId ||
      !item.title ||
      item.percentageOfProject === undefined ||
      item.percentageToRelease === undefined ||
      !item.dueDate
    ) {
      throw new Error(
        "Create action requires contributorId, title, percentageOfProject, percentageToRelease, and dueDate."
      );
    }

    const taskCreateData: Prisma.TaskCreateWithoutMilestoneInput = {
      contributor: {
        connect: { id: item.contributorId },
      },
      title: item.title,
      priority: item.priority,
      dueDate: item.dueDate,
      description: item.description,
      percentageOfProject: item.percentageOfProject,
      percentageToRelease: item.percentageToRelease,
    };
    if (item.galleryItemsToCreate && item.galleryItemsToCreate.length > 0) {
      const galleryItemsData = item.galleryItemsToCreate.map((gi) => {
        if (!gi.url || !gi.fileType) {
          throw new Error("Gallery item creation requires url and fileType.");
        }
        return {
          url: gi.url,
          fileType: gi.fileType,
          projectId: projectId,
          uploadedByUserId: uploadedByUserId,
        };
      });

      taskCreateData.galleryItems = {
        create: galleryItemsData,
      };
    }

    payload.create = [taskCreateData];
  } else if (item.action === "update") {
    if (!item.id) {
      throw new Error("Update action requires Task ID.");
    }

    const taskUpdateData: Prisma.TaskUpdateWithoutMilestoneInput = {
      title: item.title,
      priority: item.priority,
      dueDate: item.dueDate,
      description: item.description,
      percentageOfProject: item.percentageOfProject,
      percentageToRelease: item.percentageToRelease,
      releaseDate: item.releaseDate,
    };

    if (item.contributorId) {
      (taskUpdateData as any).contributor = {
        connect: { id: item.contributorId },
      };
    }

    if (item.galleryItemsToCreate && item.galleryItemsToCreate.length > 0) {
      const galleryItemsData = item.galleryItemsToCreate.map((gi) => {
        if (!gi.url || !gi.fileType) {
          throw new Error("Gallery item creation requires url and fileType.");
        }
        return {
          url: gi.url,
          fileType: gi.fileType,
          projectId: projectId,
          uploadedByUserId: uploadedByUserId,
        };
      });

      (taskUpdateData as any).galleryItems = {
        create: galleryItemsData,
      };
    }

    payload.update = (payload.update as any) || [];
    (payload.update as any).push({
      where: { id: item.id },
      data: taskUpdateData,
    });
  } else if (item.action === "delete") {
    if (!item.id) {
      throw new Error("Delete action requires Task ID.");
    }

    payload.delete = (payload.delete as any) || [];
    (payload.delete as Prisma.TaskWhereUniqueInput[]).push({
      id: item.id,
    });
  } else {
    throw new Error(`Invalid action: ${item.action}.`);
  }

  return payload;
}

export async function createMilestoneTasks(
  data: ManageTasksInput
): Promise<Milestone & { tasks: Task[] }> {
  const { projectId, milestoneId, tasks, userId } = data;

  const taskPayload = processTaskUpdates(tasks, projectId, userId);

  if (!taskPayload || Object.keys(taskPayload).length === 0) {
    throw new Error("No valid tasks provided for update.");
  }

  try {
    const existingMilestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      select: { id: true, projectId: true },
    });

    if (!existingMilestone || existingMilestone.projectId !== projectId) {
      throw new Error("Milestone not found or does not belong to the project.");
    }

    const updatedMilestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        tasks: taskPayload,
      },
      include: {
        tasks: {
          include: {
            galleryItems: true,
          },
        },
      },
    });

    return updatedMilestone as Milestone & { tasks: Task[] };
  } catch (error) {
    if (error instanceof Error && error.message.includes("required")) {
      throw error;
    }
    if (
      error instanceof Error &&
      error.message.includes("Milestone not found")
    ) {
      throw error;
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new Error(
        "Related record (Milestone, Task, or Contributor) not found or concurrent modification failed."
      );
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
      throw new Error(`Invalid update data provided: ${error.message}`);
    }

    throw new Error(
      `Failed to manage milestone tasks: ${
        error instanceof Error ? error.message : "unknown error"
      }`
    );
  }
}

export async function deleteMilestoneTask(
  milestoneId: string,
  taskId: string,
  projectId: string,
  userId: string
): Promise<Milestone & { tasks: Task[] }> {
  const deleteItem: TaskUpdateItem = {
    id: taskId,
    action: "delete",
  };

  const taskPayload = processTaskUpdates([deleteItem], projectId, userId);

  try {
    const updatedMilestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        tasks: taskPayload,
      },
      include: {
        tasks: {
          include: {
            galleryItems: true,
          },
        },
      },
    });

    return updatedMilestone as Milestone & { tasks: Task[] };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new Error("Milestone or Task not found for deletion.");
    }
    throw new Error(
      `Failed to delete milestone task: ${
        error instanceof Error ? error.message : "unknown error"
      }`
    );
  }
}

export async function fetchMilestoneTasks(
  data: FetchTasksInput
): Promise<MilestoneWithTasks> {
  try {
    const milestoneWithTasks = await prisma.milestone.findUnique({
      where: { id: data.milestoneId },
      include: {
        tasks: {
          include: {
            contributor: {
              select: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    profilePhotoUrl: true,
                  },
                },
              },
            },
            galleryItems: true,
          },
          orderBy: {
            dueDate: "asc",
          },
        },
        project: {
          select: { id: true, ownerId: true },
        },
      },
    });

    if (!milestoneWithTasks) {
      throw new Error("Milestone not found.");
    }

    return milestoneWithTasks as MilestoneWithTasks;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Milestone not found")
    ) {
      throw error;
    }
    throw new Error(
      `Failed to fetch milestone tasks: ${
        error instanceof Error ? error.message : "unknown error"
      }`
    );
  }
}
