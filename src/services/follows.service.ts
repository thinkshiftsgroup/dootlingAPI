import { PrismaClient, Prisma, Follows, User } from "@prisma/client";

const prisma = new PrismaClient();

interface FollowInput {
  followerId: string;
  followingId: string;
}

interface FollowListInput {
  userId: string;
  limit?: number;
  skip?: number;
}

interface UserDetail {
  id: string;
  username: string;
  fullName: string;
  profilePhotoUrl: string | null;
  headline: string | null;
  country: string | null;
  role: string | null;
  industry: string | null;
  lastActive: Date | null;
  totalProjects: number;
}

interface FollowListResult {
  list: UserDetail[];
  count: number;
}

type UserWithFollowStatus = UserDetail & {
  isFollowing: boolean;
};

interface UsersToFollowInput {
  currentUserId: string;
  search?: string;
  limit?: number;
  skip?: number;
}

interface UsersToFollowResult {
  list: UserWithFollowStatus[];
  count: number;
}

export async function followUser(data: FollowInput): Promise<Follows> {
  if (data.followerId === data.followingId) {
    throw new Error("A user cannot follow themselves.");
  }

  try {
    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: data.followerId,
          followingId: data.followingId,
        },
      },
    });

    if (existingFollow) {
      return existingFollow;
    }

    const newFollow = await prisma.follows.create({
      data: {
        followerId: data.followerId,
        followingId: data.followingId,
      },
    });

    return newFollow;
  } catch (error) {
    throw new Error(`Failed to follow user ${data.followingId}.`);
  }
}

export async function unfollowUser(data: FollowInput): Promise<boolean> {
  try {
    const deletedFollow = await prisma.follows.delete({
      where: {
        followerId_followingId: {
          followerId: data.followerId,
          followingId: data.followingId,
        },
      },
    });
    return !!deletedFollow;
  } catch (error) {
    throw new Error(`Failed to unfollow user ${data.followingId}.`);
  }
}

export async function listFollowers(
  data: FollowListInput
): Promise<FollowListResult> {
  const { userId, limit = 10, skip = 0 } = data;

  try {
    const count = await prisma.follows.count({
      where: {
        followingId: userId,
      },
    });

    const followers = await prisma.follows.findMany({
      where: {
        followingId: userId,
      },
      take: limit,
      skip: skip,
      include: {
        follower: {
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
                role: true,
                industry: true,
              },
            },
            _count: {
              select: {
                projectsOwned: true,
              },
            },
          },
        },
      },
    });

    const list: UserDetail[] = followers.map((f) => {
      const { biodata, _count, ...user } = f.follower;
      return {
        ...user,
        headline: biodata?.headline ?? null,
        country: biodata?.country ?? null,
        role: biodata?.role ?? null,
        industry: biodata?.industry ?? null,
        lastActive: user.lastActive ?? null,
        totalProjects: _count.projectsOwned,
      };
    });

    return { list, count };
  } catch (error) {
    throw new Error("Failed to list followers.");
  }
}

export async function listFollowing(
  data: FollowListInput
): Promise<FollowListResult> {
  const { userId, limit = 10, skip = 0 } = data;

  try {
    const count = await prisma.follows.count({
      where: {
        followerId: userId,
      },
    });

    const following = await prisma.follows.findMany({
      where: {
        followerId: userId,
      },
      take: limit,
      skip: skip,
      include: {
        following: {
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
                role: true,
                industry: true,
              },
            },
            _count: {
              select: {
                projectsOwned: true,
              },
            },
          },
        },
      },
    });

    const list: UserDetail[] = following.map((f) => {
      const { biodata, _count, ...user } = f.following;
      return {
        ...user,
        headline: biodata?.headline ?? null,
        country: biodata?.country ?? null,
        role: biodata?.role ?? null,
        industry: biodata?.industry ?? null,
        lastActive: user.lastActive ?? null,
        totalProjects: _count.projectsOwned,
      };
    });

    return { list, count };
  } catch (error) {
    throw new Error("Failed to list following.");
  }
}

export async function getUsersToFollow(
  data: UsersToFollowInput
): Promise<UsersToFollowResult> {
  const { currentUserId, search, limit = 10, skip = 0 } = data;

  const whereClause: Prisma.UserWhereInput = {
    NOT: { id: currentUserId },
    isVerified: true,
    ...(search && {
      OR: [
        { username: { contains: search, mode: "insensitive" } },
        { fullName: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  try {
    const count = await prisma.user.count({ where: whereClause });

    const users = await prisma.user.findMany({
      where: whereClause,
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
            role: true,
            industry: true,
          },
        },
        _count: {
          select: {
            projectsOwned: true,
          },
        },
      },
      take: limit,
      skip: skip,
      orderBy: {
        username: "asc",
      },
    });

    const followingIds = await prisma.follows
      .findMany({
        where: {
          followerId: currentUserId,
          followingId: { in: users.map((u) => u.id) },
        },
        select: { followingId: true },
      })
      .then((follows) => new Set(follows.map((f) => f.followingId)));

    const list: UserWithFollowStatus[] = users.map((user) => {
      const { biodata, _count, ...rest } = user;
      return {
        ...rest,
        headline: biodata?.headline ?? null,
        country: biodata?.country ?? null,
        role: biodata?.role ?? null,
        industry: biodata?.industry ?? null,
        lastActive: rest.lastActive ?? null,
        totalProjects: _count.projectsOwned,
        isFollowing: followingIds.has(user.id),
      };
    });

    return { list, count };
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch users to follow.");
  }
}
