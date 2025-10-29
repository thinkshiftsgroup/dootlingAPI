import axios from "axios";
import FormData from "form-data";
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

  const formData = new FormData();

  formData.append("file", file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });

  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

    const response = await axios.post<CloudinaryUploadResponse>(
      uploadUrl,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 60000,
      }
    );

    return response.data.secure_url;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorData = error.response.data as { error?: { message: string } };
      throw new Error(
        `Upload failed. Cloudinary message: ${
          errorData.error?.message || "Unknown network error."
        }`
      );
    }

    throw new Error(
      "Failed to connect to or receive response from Cloudinary."
    );
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
