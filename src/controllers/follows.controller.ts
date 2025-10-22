import { Request, Response } from "express";
import {
  followUser,
  unfollowUser,
  listFollowers,
  listFollowing,
  getUsersToFollow,
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
const parsePaginationParams = (req: Request) => {
  const limit = req.query.limit
    ? parseInt(req.query.limit as string, 10)
    : undefined;
  const skip = req.query.skip
    ? parseInt(req.query.skip as string, 10)
    : undefined;

  if (limit !== undefined && (isNaN(limit) || limit <= 0)) {
    throw new Error("Limit must be a positive integer.");
  }
  if (skip !== undefined && (isNaN(skip) || skip < 0)) {
    throw new Error("Skip must be a non-negative integer.");
  }

  return { limit, skip };
};

const getFollowers = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string;

  if (!userId) {
    return res.status(401).json({ message: "User not authenticated." });
  }

  try {
    const { limit, skip } = parsePaginationParams(req);

    const followers = await listFollowers({
      userId,
      limit,
      skip,
    });

    return res.status(200).json(followers);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to retrieve followers.";

    const statusCode = errorMessage.includes("integer") ? 400 : 500;

    return res.status(statusCode).json({ message: errorMessage });
  }
};

const getFollowing = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string;

  if (!userId) {
    return res.status(401).json({ message: "User not authenticated." });
  }

  try {
    const { limit, skip } = parsePaginationParams(req);

    const following = await listFollowing({
      userId,
      limit,
      skip,
    });

    return res.status(200).json(following);
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to retrieve following list.";

    const statusCode = errorMessage.includes("integer") ? 400 : 500;

    return res.status(statusCode).json({ message: errorMessage });
  }
};
const getUsers = async (req: Request, res: Response) => {
  const currentUserId = (req as any).user?.id as string;
  const { search, limit, skip } = req.query;

  if (!currentUserId) {
    return res.status(401).json({ message: "User not authenticated." });
  }

  try {
    const result = await getUsersToFollow({
      currentUserId,
      search: search as string,
      limit: limit ? parseInt(limit as string) : undefined,
      skip: skip ? parseInt(skip as string) : undefined,
    });

    return res.status(200).json(result);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to retrieve users list.";
    return res.status(500).json({ message: errorMessage });
  }
};

export const followsController = {
  follow,
  unfollow,
  getFollowers,
  getFollowing,
  getUsers,
};
