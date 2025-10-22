import { PrismaClient, Project } from "@prisma/client";

const prisma = new PrismaClient();

interface PublicProjectDetail {
  id: string;
  title: string;
  isPublic: boolean;
  createdAt: Date;
  owner: {
    id: string;
    username: string;
    fullName: string;
    profilePhotoUrl: string | null;
  };
}

interface FetchPublicProjectsInput {
  limit?: number;
  skip?: number;
}

export async function fetchPublicProjects(
  data: FetchPublicProjectsInput
): Promise<PublicProjectDetail[]> {
  const { limit = 10, skip = 0 } = data;

  try {
    const projects = await prisma.project.findMany({
      where: {
        isPublic: true,
        isDeleted: false,
        status: {
          not: "INACTIVE",
        },
      },
      select: {
        id: true,
        title: true,
        isPublic: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhotoUrl: true,
          },
        },
      },
      take: limit,
      skip: skip,
      orderBy: {
        createdAt: "desc",
      },
    });

    return projects as unknown as PublicProjectDetail[];
  } catch (error) {
    throw new Error(
      `Failed to fetch public projects: ${
        error instanceof Error ? error.message : "unknown error"
      }`
    );
  }
}
