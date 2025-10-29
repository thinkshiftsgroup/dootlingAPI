import {
  PrismaClient,
  Prisma,
  Project,
  Contributor,
  PaymentAudit,
} from "@prisma/client";
import { ManageEscrowProjectInput, ContributorUpdateItem } from "src/types";
const prisma = new PrismaClient();

interface CreateProjectInput {
  ownerId: string;
  title: string;
  description: string;
  isPublic: boolean;
  contributorIds?: string[];
  projectImageUrl?: string;
}

type ProjectDetail = Project & {
  owner: { id: string; fullName: string; username: string };
  contributors: Contributor[];
};

type ProjectInvitation = Project & {
  owner: { id: string; fullName: string; username: string };
};
export async function createProject(
  data: CreateProjectInput
): Promise<Project> {
  const { ownerId, contributorIds, ...projectData } = data;

  const contributorConnects: Prisma.ContributorCreateManyProjectInput[] = (
    contributorIds || []
  )
    .filter((userId) => userId !== ownerId)
    .map((userId) => ({
      userId: userId,
      budgetPercentage: 0,
    }));

  const projectCreateData: Prisma.ProjectCreateInput = {
    ...projectData,
    owner: { connect: { id: ownerId } },
    status: "PENDING",
  };

  if (contributorConnects.length > 0) {
    projectCreateData.contributors = {
      createMany: {
        data: contributorConnects,
      },
    };
  }

  try {
    const newProject = await prisma.project.create({
      data: projectCreateData,
    });
    return newProject;
  } catch (error) {
    throw new Error(
      `Failed to create project: ${
        error instanceof Error ? error.message : "unknown error"
      }`
    );
  }
}
interface MakeEscrowTrueInput {
  projectId: string;
}

export async function makeProjectEscrow(
  data: MakeEscrowTrueInput
): Promise<Project> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      select: { isEscrowed: true },
    });

    if (!project) {
      throw new Error("Project not found.");
    }

    if (project.isEscrowed) {
      throw new Error(
        "Project is already marked as escrowed and cannot be updated again."
      );
    }

    const updatedProject = await prisma.project.update({
      where: {
        id: data.projectId,
      },
      data: {
        isEscrowed: true,
      } as Prisma.ProjectUpdateInput,
    });

    return updatedProject;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new Error("Project not found.");
    }

    throw new Error(
      `Failed to mark project as escrow: ${
        error instanceof Error ? error.message : "unknown error"
      }`
    );
  }
}
function processContributors(
  items: ContributorUpdateItem[]
): Prisma.ProjectUpdateInput["contributors"] {
  const payload: Prisma.ProjectUpdateInput["contributors"] = {};

  for (const item of items) {
    if (item.action === "create") {
      if (!item.userId) {
        throw new Error("Create action requires userId and budgetPercentage.");
      }

      payload.create = (payload.create as any) || [];

      (payload.create as Prisma.ContributorCreateWithoutProjectInput[]).push({
        user: {
          connect: {
            id: item.userId as string,
          },
        },
        role: item.role,
        budgetPercentage:
          item.budgetPercentage !== undefined ? item.budgetPercentage : 0.0,
        releasePercentage: item.releasePercentage,
      });
    } else if (item.action === "update") {
      if (!item.id) {
        throw new Error("Update action requires contributor id.");
      }

      payload.update = (payload.update as any) || [];

      (
        payload.update as {
          where: { id: string };
          data: Prisma.ContributorUpdateWithoutProjectInput;
        }[]
      ).push({
        where: { id: item.id },
        data: {
          role: item.role,
          budgetPercentage: item.budgetPercentage,
          releasePercentage: item.releasePercentage,
        },
      });
    } else if (item.action === "delete") {
      if (!item.id) {
        throw new Error("Delete action requires contributor id.");
      }

      payload.delete = (payload.delete as any) || [];

      (payload.delete as { id: string }[]).push({ id: item.id });
    }
  }
  return payload;
}
export async function manageEscrowProject(
  data: ManageEscrowProjectInput
): Promise<Project> {
  const { projectId, contributors, ...projectUpdateData } = data;

  const contributorPayload = contributors
    ? processContributors(contributors)
    : {};

  const hasContributorUpdates =
    contributorPayload && Object.keys(contributorPayload).length > 0;

  const updatePayload: Prisma.ProjectUpdateInput = {
    ...projectUpdateData,
    ...(hasContributorUpdates && { contributors: contributorPayload }),
  };

  if (
    Object.keys(projectUpdateData).length === 0 &&
    (!contributorPayload || Object.keys(contributorPayload).length === 0)
  ) {
    throw new Error("No fields provided for update.");
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
      data: updatePayload,
      include: {
        contributors: true,
      },
    });

    return updatedProject;
  } catch (error) {
    if (error instanceof Error && error.message === "Project not found") {
      throw error;
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new Error("Project not found or concurrent modification failed.");
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      throw new Error(`Invalid update data provided: ${error.message}`);
    }

    throw new Error(
      `Failed to update project: ${
        error instanceof Error ? error.message : "unknown error"
      }`
    );
  }
}

export type ProjectDetails = Project & {
  contributors: (Contributor & {
    user: {
      id: string;
      email: string;
      fullName: string;
      profilePhotoUrl: string | null;
    };
  })[];
  payments: PaymentAudit[];
};

export async function getProjectDetails(
  projectId: string
): Promise<ProjectDetails> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        contributors: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
                profilePhotoUrl: true,
              },
            },
          },
        },
        payments: true,
      },
    });

    if (!project) {
      throw new Error("Project not found.");
    }

    return project as ProjectDetails;
  } catch (error) {
    if (error instanceof Error && error.message === "Project not found") {
      throw error;
    }

    throw new Error(
      `Failed to fetch project details: ${
        error instanceof Error ? error.message : "unknown error"
      }`
    );
  }
}
export async function fetchAllContributors(
  projectId: string
): Promise<Contributor[]> {
  try {
    const contributors = await prisma.contributor.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhotoUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return contributors as unknown as Contributor[];
  } catch (error) {
    throw new Error("Failed to fetch project contributors.");
  }
}

export async function fetchRecentlyAddedContributors(
  projectId: string,
  limit: number = 5
): Promise<Contributor[]> {
  try {
    const contributors = await prisma.contributor.findMany({
      where: { projectId },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhotoUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return contributors as unknown as Contributor[];
  } catch (error) {
    throw new Error("Failed to fetch recently added contributors.");
  }
}

type ProjectWithContributorCount = Project & {
  _count: {
    contributors: number;
  };
};

export async function fetchUserOwnedProjects(
  userId: string
): Promise<ProjectWithContributorCount[]> {
  try {
    const projects = await prisma.project.findMany({
      where: { ownerId: userId, isDeleted: false },
      select: {
        id: true,
        ownerId: true,
        title: true,
        description: true,
        isPublic: true,
        status: true,
        totalBudget: true,
        startDate: true,
        deliveryDate: true,
        contractClauses: true,
        receiveEmailNotifications: true,
        fundsRule: true,
        isDeleted: true,
        isEscrowed: true,
        amountReleased: true,
        amountPending: true,
        completionPercentage: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            contributors: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return projects as unknown as ProjectWithContributorCount[];
  } catch (error) {
    console.error("Error fetching user-owned projects:", error);
    throw new Error("Failed to fetch user-owned projects.");
  }
}
type GeneralContributorRecord = Contributor & {
  project: {
    id: string;
    title: string;
  };
  user: {
    id: string;
    username: string;
    fullName: string;
    profilePhotoUrl: string | null;
    lastActive: Date | null;
    headline: string | null;
    country: string | null;
  };
};

export async function fetchGeneralContributors(
  ownerId: string
): Promise<GeneralContributorRecord[]> {
  try {
    const contributorRecords = await prisma.contributor.findMany({
      where: {
        project: {
          ownerId: ownerId,
          isDeleted: false,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhotoUrl: true,
            lastActive: true,
            biodata: {
              select: {
                headline: true,
                country: true,
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const mappedRecords = contributorRecords.map((record) => ({
      ...record,
      user: {
        id: record.user.id,
        username: record.user.username,
        fullName: record.user.fullName,
        profilePhotoUrl: record.user.profilePhotoUrl,
        lastActive: record.user.lastActive,
        headline: record.user.biodata?.headline ?? null,
        country: record.user.biodata?.country ?? null,
      },
    }));

    return mappedRecords as unknown as GeneralContributorRecord[];
  } catch (error) {
    throw new Error("Failed to fetch general contributor list.");
  }
}

export async function fetchRecentGeneralContributors(
  ownerId: string,
  limit: number = 5
): Promise<GeneralContributorRecord[]> {
  try {
    const contributorRecords = await prisma.contributor.findMany({
      where: {
        project: {
          ownerId: ownerId,
          isDeleted: false,
        },
      },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhotoUrl: true,
            lastActive: true,
            biodata: {
              select: {
                headline: true,
                country: true,
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const mappedRecords = contributorRecords.map((record) => ({
      ...record,
      user: {
        id: record.user.id,
        username: record.user.username,
        fullName: record.user.fullName,
        profilePhotoUrl: record.user.profilePhotoUrl,
        lastActive: record.user.lastActive,
        headline: record.user.biodata?.headline ?? null,
        country: record.user.biodata?.country ?? null,
      },
    }));

    return mappedRecords as unknown as GeneralContributorRecord[];
  } catch (error) {
    throw new Error("Failed to fetch recently added general contributors.");
  }
}
export async function fetchUserContributorProjects(
  userId: string
): Promise<ProjectInvitation[]> {
  try {
    const contributorProjects = await prisma.contributor.findMany({
      where: { userId: userId },
      select: {
        project: {
          include: {
            owner: {
              select: {
                id: true,
                fullName: true,
                username: true,
              },
            },
          },
        },
      },
    });

    const projects = contributorProjects
      .map((c) => c.project)
      .filter((p) => p.isDeleted === false) as unknown as ProjectInvitation[];

    return projects;
  } catch (error) {
    throw new Error("Failed to fetch invited projects.");
  }
}
