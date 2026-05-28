import imageCompression from 'browser-image-compression';
import type { CloudinarySignature } from '@/store/endpoints/mediaApi';

const MAX_MEDIA_FILES = 6;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
]);

type CloudinaryUploadResponse = {
  secure_url?: string;
  error?: {
    message?: string;
  };
};

type GetCloudinarySignature = () => Promise<CloudinarySignature>;

const getCloudinaryConfig = () => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;

  if (!cloudName || !apiKey) {
    throw new Error('Cloudinary frontend environment variables are missing.');
  }

  return { cloudName, apiKey };
};

export const validateMediaFiles = (files: File[] | FileList, existingCount = 0): File[] => {
  const selectedFiles = Array.from(files);

  if (existingCount + selectedFiles.length > MAX_MEDIA_FILES) {
    throw new Error(`You can only have a maximum of ${MAX_MEDIA_FILES} media files in total.`);
  }

  selectedFiles.forEach((file) => {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, WEBP, and MP4 are allowed.');
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error('Each media file must be 10MB or smaller.');
    }
  });

  return selectedFiles;
};

const compressIfImage = async (file: File): Promise<File> => {
  if (!file.type.startsWith('image/')) return file;

  const compressed = await imageCompression(file, {
    maxSizeMB: 2,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: file.type,
  });

  return compressed instanceof File
    ? compressed
    : new File([compressed], file.name, { type: file.type, lastModified: Date.now() });
};

export const uploadMediaFile = async (
  file: File,
  getCloudinarySignature: GetCloudinarySignature
): Promise<string> => {
  const { cloudName, apiKey } = getCloudinaryConfig();
  const { timestamp, signature } = await getCloudinarySignature();
  const uploadFile = await compressIfImage(file);

  const formData = new FormData();
  formData.append('file', uploadFile);
  formData.append('api_key', apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: 'POST',
    body: formData,
  });
  const payload = (await response.json().catch(() => ({}))) as CloudinaryUploadResponse;

  if (!response.ok || !payload.secure_url) {
    throw new Error(payload.error?.message ?? 'Cloudinary upload failed. Please try again.');
  }

  return payload.secure_url;
};

export const uploadListingMedia = async (
  files: File[] | FileList | null | undefined,
  getCloudinarySignature: GetCloudinarySignature,
  existingCount = 0,
  onUploaded?: (url: string) => void
): Promise<string[]> => {
  if (!files || files.length === 0) return [];

  const selectedFiles = validateMediaFiles(files, existingCount);
  return Promise.all(
    selectedFiles.map(async (file) => {
      const url = await uploadMediaFile(file, getCloudinarySignature);
      onUploaded?.(url);
      return url;
    })
  );
};
