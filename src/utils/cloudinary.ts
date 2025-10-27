import FormData from "form-data";
// import fetch from "node-fetch";
import { MulterFile } from "@controllers/project.milestone.controller";
export type CloudinaryResourceTypes = "image" | "video" | "raw" | "auto";

interface CloudinaryUploadResponse {
  secure_url: string;
}

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const uploadToCloudinary = async (
  file: MulterFile,
  resourceType: CloudinaryResourceTypes = "auto"
): Promise<string> => {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "Missing CLOUDINARY_CLOUD_NAME or UPLOAD_PRESET environment variables."
    );
  }
  console.log("CLOUD_NAME Value:", CLOUD_NAME);
  console.log("UPLOAD_PRESET Value:", UPLOAD_PRESET);
  console.log("File Original Name:", file);

  const formData = new FormData();

  formData.append("file", file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });

  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
      {
        method: "POST",
        body: formData,
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Upload failed. Cloudinary response: ${errorText.substring(0, 100)}...`
      );
    }

    const data = (await response.json()) as CloudinaryUploadResponse;
    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

export const uploadMultipleToCloudinary = async (
  files: MulterFile[],
  resourceType: CloudinaryResourceTypes = "auto"
): Promise<string[]> => {
  const uploadPromises = files.map((file) =>
    uploadToCloudinary(file, resourceType)
  );
  return Promise.all(uploadPromises);
};
