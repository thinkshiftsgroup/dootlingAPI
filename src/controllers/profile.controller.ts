import { Request, Response } from "express";
import * as profileService from "../services/profile.service";

export const getProfileController = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  console.log(req.user);
  if (!userId) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    const biodata = await profileService.fetchBiodata(userId);

    if (!biodata) {
      return res.status(404).json({ message: "Profile data not found." });
    }

    return res.status(200).json(biodata);
  } catch (error) {
    console.error("Error in getProfileController:", error);
    return res.status(500).json({
      message: (error as Error).message || "Could not fetch profile.",
    });
  }
};

export const updateProfileController = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    const dataToUpdate = req.body;

    if (Object.keys(dataToUpdate).length === 0) {
      return res
        .status(400)
        .json({ message: "No fields provided for update." });
    }

    const updatedProfile = await profileService.updateProfile(
      userId,
      dataToUpdate
    );

    return res.status(200).json(updatedProfile);
  } catch (error) {
    console.error("Error in updateProfileController:", error);
    return res.status(400).json({
      message: (error as Error).message || "Could not update profile.",
    });
  }
};
