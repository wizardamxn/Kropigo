import { Request, Response } from "express";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env";
import { deleteMediaByUrls } from "../services/upload.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";

const parseMediaUrls = (value: unknown): string[] => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new ApiError(400, "mediaUrls must be an array of strings");
  }

  return value;
};

export const getCloudinarySignature = (req: Request, res: Response): void => {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp },
    env.CLOUDINARY_API_SECRET,
  );

  res.status(200).json({ timestamp, signature });
};

export const deleteUploadedMedia = asyncHandler(async (req: Request, res: Response) => {
  const mediaUrls = parseMediaUrls(req.body.mediaUrls);

  if (mediaUrls.length > 6) {
    throw new ApiError(400, "Maximum 6 media files allowed");
  }

  await deleteMediaByUrls(mediaUrls);
  res.status(200).json({ success: true, message: "Uploaded media deleted successfully" });
});
