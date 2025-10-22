import { PrismaClient, Prisma, Project, Contributor } from "@prisma/client";

const prisma = new PrismaClient();

interface CreateProjectInput {
  ownerId: string;
  title: string;
  description: string;
  isPublic: boolean;
  contributorIds?: string[];
}
interface ManageEscrowProjectInput {
  projectId: string;
  totalBudget?: number;
  startDate?: Date;
  deliveryDate?: Date;
  contractClauses?: string;
  fundsRule?: boolean;
  status?: string;
  isDeleted?: boolean;
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
    const updatedProject = await prisma.project.update({
      where: { id: data.projectId },
      data: {
        isEscrowed: true,
      } as Prisma.ProjectUpdateInput,
    });

    if (!updatedProject) {
      throw new Error("Project not found.");
    }

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
export async function manageEscrowProject(
  data: ManageEscrowProjectInput
): Promise<Project> {
  const { projectId, ...updateData } = data;

  if (Object.keys(updateData).length === 0) {
    throw new Error("No fields provided for update.");
  }

  try {
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
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
      `Failed to update project: ${
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

export async function fetchUserOwnedProjects(
  userId: string
): Promise<Project[]> {
  try {
    const projects = await prisma.project.findMany({
      where: { ownerId: userId, isDeleted: false },
      orderBy: {
        createdAt: "desc",
      },
    });
    return projects;
  } catch (error) {
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
