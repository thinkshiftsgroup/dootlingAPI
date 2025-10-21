import { PrismaClient, Prisma, Follows, User } from "@prisma/client";

const prisma = new PrismaClient();

interface FollowInput {
  followerId: string;
  followingId: string;
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
interface FollowListResult {
  list: Array<{
    id: string;
    username: string;
    fullName: string;
    profilePhotoUrl: string | null;
  }>;
  count: number;
}

export async function listFollowers(userId: string): Promise<FollowListResult> {
  try {
    const followers = await prisma.follows.findMany({
      where: {
        followingId: userId,
      },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhotoUrl: true,
          },
        },
      },
    });

    const list = followers.map((f) => f.follower);
    const count = list.length;

    return { list, count };
  } catch (error) {
    throw new Error("Failed to list followers.");
  }
}

export async function listFollowing(userId: string): Promise<FollowListResult> {
  try {
    const following = await prisma.follows.findMany({
      where: {
        followerId: userId,
      },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePhotoUrl: true,
          },
        },
      },
    });

    const list = following.map((f) => f.following);
    const count = list.length;

    return { list, count };
  } catch (error) {
    throw new Error("Failed to list following.");
  }
}

interface UsersToFollowInput {
  currentUserId: string;
  search?: string;
  limit?: number;
  skip?: number;
}

type UserWithFollowStatus = Pick<
  User,
  "id" | "username" | "fullName" | "profilePhotoUrl"
> & {
  isFollowing: boolean;
};

interface UsersToFollowResult {
  list: UserWithFollowStatus[];
  count: number;
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

    const list: UserWithFollowStatus[] = users.map((user) => ({
      ...user,
      isFollowing: followingIds.has(user.id),
    }));

    return { list, count };
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch users to follow.");
  }
}
