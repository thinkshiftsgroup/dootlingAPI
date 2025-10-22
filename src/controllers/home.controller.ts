import { Request, Response, NextFunction } from "express";
import * as homeService from "@services/home.service";
import { Prisma } from "@prisma/client";

const handleServiceError = (res: Response, error: unknown) => {
  if (error instanceof Error) {
    if (error.message.includes("Failed to fetch public projects")) {
      return res.status(500).json({ message: error.message });
    }
    return res.status(500).json({
      message: "An unexpected server error occurred.",
      detail: error.message,
    });
  }
  return res.status(500).json({ message: "An unknown server error occurred." });
};

export const fetchPublicProjectsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = parseInt(req.query.skip as string) || 0;

  if (limit <= 0 || skip < 0) {
    return res.status(400).json({
      message:
        "Invalid pagination parameters. Limit must be positive and skip non-negative.",
    });
  }

  try {
    const projects = await homeService.fetchPublicProjects({ limit, skip });

    return res.status(200).json({
      message: "Public projects fetched successfully.",
      data: projects,
    });
  } catch (error) {
    handleServiceError(res, error);
  }
};
