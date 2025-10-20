import { Request, Response } from "express";
import * as profileService from "../services/profile.service";

export const getProfileController = async (req: Request, res: Response) => {
  const userId = req.user?.id;
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

export const updateProfilePhotoController = async (
  req: Request,
  res: Response
) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Authentication required." });
  }

  const { profilePhotoUrl } = req.body as { profilePhotoUrl?: string };

  if (!profilePhotoUrl) {
    return res
      .status(400)
      .json({ message: "Missing profilePhotoUrl in request body." });
  }

  try {
    const updatedUser = await profileService.updateProfilePhotoUrl(
      userId,
      profilePhotoUrl
    );

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error in updateProfilePhotoController:", error);
    return res.status(500).json({
      message: (error as Error).message || "Could not update profile photo.",
    });
  }
};

export const removeProfilePhotoController = async (
  req: Request,
  res: Response
) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    const updatedUser = await profileService.updateProfilePhotoUrl(
      userId,
      null
    );

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error in removeProfilePhotoController:", error);
    return res.status(500).json({
      message: (error as Error).message || "Could not remove profile photo.",
    });
  }
};
