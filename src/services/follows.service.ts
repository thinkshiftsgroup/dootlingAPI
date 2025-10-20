import { PrismaClient, Follows } from "@prisma/client";

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

export async function listFollowers(userId: string): Promise<Follows[]> {
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
    return followers;
  } catch (error) {
    throw new Error("Failed to list followers.");
  }
}

export async function listFollowing(userId: string): Promise<Follows[]> {
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
    return following;
  } catch (error) {
    throw new Error("Failed to list following.");
  }
}
