import { Request, Response } from "express";
import {
  followUser,
  unfollowUser,
  listFollowers,
  listFollowing,
} from "@services/follows.service";

const follow = async (req: Request, res: Response) => {
  const followerId = (req as any).user?.id as string;
  const followingId = req.params.followingId as string;

  if (!followingId) {
    return res.status(400).json({ message: "Target user ID is required." });
  }

  try {
    const result = await followUser({ followerId, followingId });

    return res.status(201).json({
      message: "User followed successfully.",
      followId: result.id,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to process follow request.";
    return res.status(500).json({ message: errorMessage });
  }
};

const unfollow = async (req: Request, res: Response) => {
  const followerId = (req as any).user?.id as string;
  const followingId = req.params.followingId as string;

  try {
    const success = await unfollowUser({ followerId, followingId });

    if (!success) {
      return res
        .status(404)
        .json({ message: "Follow relationship not found." });
    }

    return res.status(200).json({ message: "User unfollowed successfully." });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to process unfollow request.";
    return res.status(500).json({ message: errorMessage });
  }
};

const getFollowers = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string;

  try {
    const followers = await listFollowers(userId);
    return res.status(200).json(followers);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to retrieve followers.";
    return res.status(500).json({ message: errorMessage });
  }
};

const getFollowing = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string;

  try {
    const following = await listFollowing(userId);
    return res.status(200).json(following);
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to retrieve following list.";
    return res.status(500).json({ message: errorMessage });
  }
};

export const followsController = {
  follow,
  unfollow,
  getFollowers,
  getFollowing,
};
