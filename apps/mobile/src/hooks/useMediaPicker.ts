import { useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { PickedAsset } from '@/lib/cloudinaryUpload';

const toPickedAsset = (asset: ImagePicker.ImagePickerAsset): PickedAsset => ({
  uri: asset.uri,
  type: asset.type ?? undefined,
  fileName: asset.fileName,
  mimeType: asset.mimeType,
  fileSize: asset.fileSize,
});

/**
 * Wraps the gallery/camera pickers with permission prompts. Returns [] when the
 * user cancels or denies, so callers never need to branch on those cases.
 */
export function useMediaPicker() {
  const pickFromLibrary = useCallback(async (options?: { selectionLimit?: number; allowVideo?: boolean }) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to attach media to your listing.');
      return [];
    }

    const selectionLimit = options?.selectionLimit ?? 1;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: options?.allowVideo ? ['images', 'videos'] : ['images'],
      allowsMultipleSelection: selectionLimit > 1,
      selectionLimit,
      quality: 1,
    });
    return result.canceled ? [] : result.assets.map(toPickedAsset);
  }, []);

  const captureFromCamera = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow camera access to take a photo.');
      return [];
    }

    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
    return result.canceled ? [] : result.assets.map(toPickedAsset);
  }, []);

  /** Presents the camera/gallery choice used by every single-photo KYC field. */
  const pickOne = useCallback(
    (onPicked: (asset: PickedAsset) => void) => {
      Alert.alert('Add photo', 'Choose a source', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: async () => { const [asset] = await captureFromCamera(); if (asset) onPicked(asset); } },
        { text: 'Gallery', onPress: async () => { const [asset] = await pickFromLibrary(); if (asset) onPicked(asset); } },
      ]);
    },
    [captureFromCamera, pickFromLibrary],
  );

  return { pickFromLibrary, captureFromCamera, pickOne };
}
