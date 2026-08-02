import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import type { CloudinarySignature } from '@/store/mediaApi';

export const MAX_MEDIA_FILES = 6;
/** Videos are not compressed on-device in v1, so cap them well below Cloudinary's limit. */
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const TARGET_IMAGE_WIDTH = 1920;

export interface PickedAsset {
  uri: string;
  /** expo-image-picker reports 'image' or 'video' here. */
  type?: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number;
}

type GetSignature = () => Promise<CloudinarySignature>;

const getConfig = () => {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY;
  if (!cloudName || !apiKey) {
    throw new Error('Cloudinary is not configured. Set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and _API_KEY.');
  }
  return { cloudName, apiKey };
};

const isVideo = (asset: PickedAsset) =>
  asset.type === 'video' || (asset.mimeType ?? '').startsWith('video/');

/**
 * Resize to 1920px wide at q0.8, retrying at q0.6 if the result is still over 2MB —
 * the same budget the web app's browser-image-compression config targets.
 */
const compressImage = async (uri: string): Promise<{ uri: string; mimeType: string; name: string }> => {
  const image = await ImageManipulator.manipulate(uri).resize({ width: TARGET_IMAGE_WIDTH }).renderAsync();

  let result = await image.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
  if (fileSizeOf(result.uri) > 2 * 1024 * 1024) {
    result = await image.saveAsync({ compress: 0.6, format: SaveFormat.JPEG });
  }

  return { uri: result.uri, mimeType: 'image/jpeg', name: `upload-${Date.now()}.jpg` };
};

/** Returns 0 when the file can't be read, which simply skips the re-compress retry. */
const fileSizeOf = (uri: string): number => {
  try {
    return new File(uri).size;
  } catch {
    return 0;
  }
};

/**
 * The server signs ONLY `{ timestamp }`, so the multipart body must contain exactly
 * file + api_key + timestamp + signature. Any extra signed param returns 401.
 */
export const uploadMediaAsset = async (asset: PickedAsset, getSignature: GetSignature): Promise<string> => {
  const { cloudName, apiKey } = getConfig();

  if (isVideo(asset) && asset.fileSize && asset.fileSize > MAX_VIDEO_BYTES) {
    throw new Error('Videos must be 50MB or smaller.');
  }

  const file = isVideo(asset)
    ? { uri: asset.uri, mimeType: asset.mimeType ?? 'video/mp4', name: asset.fileName ?? `upload-${Date.now()}.mp4` }
    : await compressImage(asset.uri);

  // Fetch the signature after compression — signatures expire, compression can be slow.
  const { timestamp, signature } = await getSignature();

  const formData = new FormData();
  // React Native's FormData takes this {uri,type,name} shape rather than a Blob.
  formData.append('file', { uri: file.uri, type: file.mimeType, name: file.name } as unknown as Blob);
  formData.append('api_key', apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: 'POST',
    body: formData,
  });
  const payload = (await response.json().catch(() => ({}))) as { secure_url?: string; error?: { message?: string } };

  if (!response.ok || !payload.secure_url) {
    throw new Error(payload.error?.message ?? 'Upload failed. Please try again.');
  }
  return payload.secure_url;
};

/**
 * Uploads sequentially (memory-friendly on low-end devices) and reports progress
 * per file. Returns every URL that succeeded so the caller can clean them up if a
 * later file fails.
 */
export const uploadMediaAssets = async (
  assets: PickedAsset[],
  getSignature: GetSignature,
  onProgress?: (uploaded: number, total: number) => void,
): Promise<string[]> => {
  const urls: string[] = [];
  for (let i = 0; i < assets.length; i++) {
    onProgress?.(i, assets.length);
    urls.push(await uploadMediaAsset(assets[i], getSignature));
  }
  onProgress?.(assets.length, assets.length);
  return urls;
};
