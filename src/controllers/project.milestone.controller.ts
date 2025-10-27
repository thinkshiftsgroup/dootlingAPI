import { Request, Response, NextFunction } from "express";
import {
  manageProjectMilestones,
  ManageMilestonesInput,
} from "@services/project.milestone.service";
import { Prisma } from "@prisma/client";

export const updateProjectMilestones = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.projectId as string;

    const { milestones } = req.body;

    const userId = req.user?.id;
    const inputData: ManageMilestonesInput = {
      projectId,
      userId: userId || "",
      milestones,
    };

    const updatedProject = await manageProjectMilestones(inputData);

    return res.status(200).json(updatedProject.milestones);
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes("not found") ||
        error.message.includes("modification failed")
      ) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes("requires")) {
        return res.status(400).json({ message: error.message });
      }
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Prisma Error:", error.code, error.message);
      return res
        .status(500)
        .json({ message: "Database operation failed.", code: error.code });
    }
    return res.status(500).json({
      message:
        "An unexpected error occurred while managing project milestones.",
    });
  }
};
