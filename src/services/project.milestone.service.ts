import { PrismaClient, Project, Milestone, Prisma } from "@prisma/client";

export type GalleryItemCreateInput = {
  url: string;
  fileType: string;
};

export type MilestoneUpdateItem = {
  id?: string;
  action: "create" | "update" | "delete";
  title?: string;
  releasePercentage?: number;
  dueDate?: Date;
  description?: string;
  galleryItemsToCreate?: GalleryItemCreateInput[];
};

export type ManageMilestonesInput = {
  projectId: string;
  userId: string;
  milestones: MilestoneUpdateItem[];
};

const prisma = new PrismaClient();

function processMilestoneUpdates(
  items: MilestoneUpdateItem[],
  projectId: string,
  uploadedByUserId: string
): Prisma.ProjectUpdateInput["milestones"] {
  const payload: Prisma.ProjectUpdateInput["milestones"] = {};

  if (items.length !== 1) {
    throw new Error(
      "This service requires exactly one milestone item for processing."
    );
  }

  const item = items[0];

  if (item.action === "create") {
    if (!item.title || item.releasePercentage === undefined || !item.dueDate) {
      throw new Error(
        "Create action requires title, releasePercentage, and dueDate."
      );
    }

    const milestoneCreateData: Prisma.MilestoneCreateWithoutProjectInput = {
      title: item.title,
      releasePercentage: item.releasePercentage,
      dueDate: item.dueDate,
      description: item.description,
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

      milestoneCreateData.galleryItems = {
        create: galleryItemsData,
      };
    }

    payload.create = (payload.create as any) || [];
    (payload.create as Prisma.MilestoneCreateWithoutProjectInput[]).push(
      milestoneCreateData
    );
  } else {
    throw new Error(
      `Invalid action '${item.action}': This service is designed only for creating a single milestone.`
    );
  }

  return payload;
}

export async function manageProjectMilestones(
  data: ManageMilestonesInput
): Promise<Project & { milestones: Milestone[] }> {
  const { projectId, milestones, userId } = data;

  const milestonePayload = processMilestoneUpdates(
    milestones,
    projectId,
    userId
  );

  if (!milestonePayload || Object.keys(milestonePayload).length === 0) {
    throw new Error("No valid milestones provided for update.");
  }

  try {
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!existingProject) {
      throw new Error("Project not found.");
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        milestones: milestonePayload,
      },
      include: {
        milestones: {
          include: {
            galleryItems: true,
          },
        },
      },
    });

    return updatedProject as Project & { milestones: Milestone[] };
  } catch (error) {
    if (error instanceof Error && error.message.includes("required")) {
      throw error;
    }
    if (error instanceof Error && error.message.includes("Project not found")) {
      throw error;
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new Error(
        "Related record (Project, Milestone, or User) not found or concurrent modification failed."
      );
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
      throw new Error(`Invalid update data provided: ${error.message}`);
    }

    throw new Error(
      `Failed to manage project milestones: ${
        error instanceof Error ? error.message : "unknown error"
      }`
    );
  }
}
