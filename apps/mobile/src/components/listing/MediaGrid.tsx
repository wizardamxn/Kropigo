import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { toast } from 'sonner-native';
import { useTranslations } from 'use-intl';
import { CachedImage } from '@/components/CachedImage';
import { useMediaPicker } from '@/hooks/useMediaPicker';
import { MAX_MEDIA_FILES, type PickedAsset } from '@/lib/cloudinaryUpload';

export interface MediaSlot {
  /** Local file URI for a not-yet-uploaded pick. */
  asset?: PickedAsset;
  /** Cloudinary URL for media already stored on the listing. */
  url?: string;
}

/**
 * Up to six photos, mixing already-uploaded URLs with freshly picked local files.
 * Uploading happens on submit so a cancelled form never leaves orphans in Cloudinary.
 */
export function MediaGrid({ slots, onChange, disabled }: {
  slots: MediaSlot[];
  onChange: (slots: MediaSlot[]) => void;
  disabled?: boolean;
}) {
  const t = useTranslations('mobile.createListing');
  const tProfile = useTranslations('mobile.profile');
  const { pickFromLibrary, captureFromCamera } = useMediaPicker();
  const remaining = MAX_MEDIA_FILES - slots.length;

  const add = (assets: PickedAsset[]) => {
    if (!assets.length) return;
    onChange([...slots, ...assets.slice(0, remaining).map((asset) => ({ asset }))]);
  };

  const promptSource = () => {
    if (remaining <= 0) {
      toast.error(t('mediaHint', { count: slots.length, max: MAX_MEDIA_FILES }));
      return;
    }
    Alert.alert(tProfile('addPhoto'), tProfile('chooseSource'), [
      { text: tProfile('camera'), onPress: async () => add(await captureFromCamera()) },
      { text: tProfile('gallery'), onPress: async () => add(await pickFromLibrary({ selectionLimit: remaining, allowVideo: true })) },
    ]);
  };

  const removeAt = (index: number) => onChange(slots.filter((_, i) => i !== index));

  return (
    <View>
      <View className="flex-row flex-wrap gap-2.5">
        {slots.map((slot, index) => (
          <View key={slot.url ?? slot.asset?.uri ?? index} className="h-[86px] w-[86px] overflow-hidden rounded-xl bg-stone-100 dark:bg-stone-800">
            <CachedImage source={{ uri: slot.url ?? slot.asset?.uri }} className="h-full w-full" />
            {!disabled ? (
              <Pressable
                onPress={() => removeAt(index)}
                hitSlop={8}
                className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-stone-950/70"
              >
                <Ionicons name="close" size={14} color="#ffffff" />
              </Pressable>
            ) : null}
          </View>
        ))}

        {remaining > 0 && !disabled ? (
          <Pressable
            onPress={promptSource}
            className="h-[86px] w-[86px] items-center justify-center rounded-xl border-2 border-dashed border-stone-300 dark:border-stone-700"
          >
            <Ionicons name="camera-outline" size={22} color="#a8a29e" />
            <Text className="mt-1 text-[10px] font-bold text-stone-500 dark:text-stone-400">{tProfile('upload')}</Text>
          </Pressable>
        ) : null}
      </View>
      <Text className="mt-2 text-xs text-stone-500 dark:text-stone-400">
        {t('mediaHint', { count: slots.length, max: MAX_MEDIA_FILES })}
      </Text>
    </View>
  );
}
