import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';
import { deleteMediaByUrls } from '../services/upload.service';

const parseMediaUrls = (value: unknown): string[] => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error('mediaUrls must be an array of strings');
  }

  return value;
};

export const getCloudinarySignature = (req: Request, res: Response): void => {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp },
    env.CLOUDINARY_API_SECRET
  );

  res.status(200).json({ timestamp, signature });
};

export const deleteUploadedMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const mediaUrls = parseMediaUrls(req.body.mediaUrls);

    if (mediaUrls.length > 6) {
      res.status(400).json({ success: false, message: 'Maximum 6 media files allowed' });
      return;
    }

    await deleteMediaByUrls(mediaUrls);
    res.status(200).json({ success: true, message: 'Uploaded media deleted successfully' });
  } catch (error: any) {
    const statusCode = error.message?.includes('must be an array') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};
