import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { toast } from 'sonner-native';
import { useTranslations } from 'use-intl';
import { CachedImage } from '@/components/CachedImage';
import { useMediaPicker } from '@/hooks/useMediaPicker';
import { uploadMediaAsset } from '@/lib/cloudinaryUpload';
import { useGetCloudinarySignatureMutation } from '@/store/mediaApi';

/**
 * A single KYC document slot. Uploads immediately on pick (unlike listing media)
 * so the URL is ready by the time the user saves, and reports the previous URL
 * back so the caller can queue it for Cloudinary cleanup.
 */
export function DocumentField({ label, hint, value, onChange, disabled }: {
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string, replacedUrl?: string) => void;
  disabled?: boolean;
}) {
  const t = useTranslations('mobile.profile');
  const tActions = useTranslations('mobile.actions');
  const { pickOne } = useMediaPicker();
  const [getSignature] = useGetCloudinarySignatureMutation();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);

  const upload = () => {
    pickOne(async (asset) => {
      setUploading(true);
      try {
        const url = await uploadMediaAsset(asset, () => getSignature().unwrap());
        onChange(url, value || undefined);
      } catch (error) {
        // The Cloudinary upload throws a plain Error; RTK failures are middleware-toasted.
        if (error instanceof Error) toast.error(error.message);
      } finally {
        setUploading(false);
      }
    });
  };

  const remove = () => {
    Alert.alert(t('removeTitle'), t('removeBody'), [
      { text: tActions('cancel'), style: 'cancel' },
      { text: t('remove'), style: 'destructive', onPress: () => onChange('', value || undefined) },
    ]);
  };

  return (
    <View className="mt-3 rounded-2xl border border-stone-200 bg-stone-50 p-3.5 dark:border-stone-800 dark:bg-stone-950">
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={value ? () => setPreview(true) : upload}
          disabled={disabled || uploading}
          className="h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-stone-200 bg-stone-100 dark:border-stone-700 dark:bg-stone-900"
        >
          {uploading ? (
            <ActivityIndicator color="#166534" />
          ) : value ? (
            <CachedImage source={{ uri: value }} className="h-full w-full" />
          ) : (
            <Ionicons name="document-outline" size={22} color="#a8a29e" />
          )}
        </Pressable>

        <View className="flex-1">
          <Text className="font-bold text-stone-800 dark:text-stone-200">{label}</Text>
          <Text className={`mt-0.5 text-xs ${value ? 'font-semibold text-primary' : 'text-stone-500 dark:text-stone-400'}`}>
            {uploading ? t('uploading') : value ? `✓ ${t('attached')}` : t('noFile')}
          </Text>
          {hint ? <Text className="mt-0.5 text-[11px] text-stone-400 dark:text-stone-500">{hint}</Text> : null}
        </View>
      </View>

      {!disabled ? (
        <View className="mt-3 flex-row gap-2">
          <Pressable
            onPress={upload}
            disabled={uploading}
            className="h-9 flex-1 flex-row items-center justify-center gap-1.5 rounded-lg bg-green-50 active:opacity-80 dark:bg-green-950"
          >
            <Ionicons name={value ? 'refresh' : 'add'} size={14} color="#166534" />
            <Text className="text-xs font-bold text-primary">{value ? t('replace') : t('upload')}</Text>
          </Pressable>
          {value ? (
            <Pressable
              onPress={remove}
              className="h-9 flex-1 flex-row items-center justify-center gap-1.5 rounded-lg bg-red-50 active:opacity-80 dark:bg-red-950"
            >
              <Ionicons name="trash-outline" size={14} color="#b91c1c" />
              <Text className="text-xs font-bold text-red-700 dark:text-red-400">{t('remove')}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <Modal visible={preview} transparent animationType="fade" onRequestClose={() => setPreview(false)}>
        <Pressable onPress={() => setPreview(false)} className="flex-1 items-center justify-center bg-stone-950/90 p-6">
          <Text className="mb-4 text-lg font-bold text-white">{label}</Text>
          {value ? <CachedImage source={{ uri: value }} className="h-[60%] w-full rounded-2xl" contentFit="contain" /> : null}
          <Text className="mt-6 text-sm text-stone-300">{t('tapToClose')}</Text>
        </Pressable>
      </Modal>
    </View>
  );
}
