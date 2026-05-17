import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

/**
 * Extracts the public ID from a Cloudinary URL.
 * Assumes format: https://res.cloudinary.com/<cloud_name>/<resource_type>/<type>/v<version>/<folder>/.../<file>.<ext>
 *
 * @param url Cloudinary secure URL
 * @returns publicId string
 */
export const extractPublicIdFromUrl = (url: string): string => {
  // Split by '/' and find the 'upload' or 'vXXXX' part to start extracting
  const parts = url.split('/');
  
  // Find index of the version string (e.g., 'v1234567890')
  const versionIndex = parts.findIndex((part) => part.startsWith('v') && !isNaN(parseInt(part.substring(1), 10)));
  
  if (versionIndex === -1 || versionIndex === parts.length - 1) {
    // Fallback: just return the last part without extension if parsing fails
    const lastPart = parts[parts.length - 1];
    return lastPart.split('.')[0];
  }

  // Combine everything after the version string
  const publicIdWithExt = parts.slice(versionIndex + 1).join('/');
  
  // Remove the file extension
  const lastDotIndex = publicIdWithExt.lastIndexOf('.');
  if (lastDotIndex === -1) return publicIdWithExt;
  
  return publicIdWithExt.substring(0, lastDotIndex);
};

/**
 * Deletes an asset from Cloudinary by its public ID.
 *
 * @param publicId The public ID of the asset
 * @param resourceType 'image' or 'video'
 */
export const deleteFromCloudinary = async (publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error(`Failed to delete asset ${publicId} from Cloudinary:`, error);
  }
};

/**
 * Deletes multiple assets from Cloudinary given their URLs.
 * 
 * @param urls Array of Cloudinary secure URLs
 */
export const deleteMediaByUrls = async (urls: string[]): Promise<void> => {
  const deletePromises = urls.map(async (url) => {
    const publicId = extractPublicIdFromUrl(url);
    // Determine if it's a video based on extension for the destroy call
    const isVideo = url.toLowerCase().endsWith('.mp4');
    await deleteFromCloudinary(publicId, isVideo ? 'video' : 'image');
  });

  await Promise.all(deletePromises);
};
