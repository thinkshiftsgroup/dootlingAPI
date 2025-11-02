import { Request, Response } from "express";
import { fetchUserBiodata } from "@services/user.service";

export const getUserProfileController = async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    const biodata = await fetchUserBiodata(userId);

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
