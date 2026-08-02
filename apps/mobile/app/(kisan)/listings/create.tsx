import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { toast } from 'sonner-native';
import { useTranslations } from 'use-intl';
import { useCreateListingMutation } from '@/store/marketplaceApi';
import { useDeleteCloudinaryMediaMutation, useGetCloudinarySignatureMutation } from '@/store/mediaApi';
import type { Crop } from '@/store/cropsApi';
import { uploadMediaAssets } from '@/lib/cloudinaryUpload';
import { CropSelector } from '@/components/listing/CropSelector';
import { MediaGrid, type MediaSlot } from '@/components/listing/MediaGrid';
import { LocationPicker, type LocationValue } from '@/components/listing/LocationPicker';
import { MandiRateCard } from '@/components/listing/MandiRateCard';
import { BackLink, Button, Card, Field, Input, Screen, SectionTitle, Segmented } from '@/components/ui';

const UNITS = ['kg', 'quintal', 'ton'] as const;
const GRADES = ['A', 'B'] as const;

export default function CreateListing() {
  const t = useTranslations('mobile.createListing');
  const tListings = useTranslations('mobile.listings');
  const [crop, setCrop] = useState<Crop>();
  const [quantity, setQuantity] = useState('');
  const [variety, setVariety] = useState('');
  const [unit, setUnit] = useState<(typeof UNITS)[number]>('quintal');
  const [grade, setGrade] = useState<(typeof GRADES)[number]>('A');
  const [description, setDescription] = useState('');
  const [media, setMedia] = useState<MediaSlot[]>([]);
  const [location, setLocation] = useState<LocationValue>({ farmAddress: '', farmState: '', farmDistrict: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState<string>();

  const [createListing, { isLoading: isSaving }] = useCreateListingMutation();
  const [getSignature] = useGetCloudinarySignatureMutation();
  const [cleanupMedia] = useDeleteCloudinaryMediaMutation();

  const busy = isSaving || uploadProgress !== undefined;

  const validate = () => {
    const next: Record<string, string> = {};
    if (!crop) next.crop = t('errorCrop');
    if (!quantity || Number(quantity) <= 0) next.quantity = t('errorQuantity');
    if (!location.farmAddress.trim()) next.address = t('errorAddress');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate() || !crop) return;

    let uploadedUrls: string[] = [];
    try {
      const assets = media.map((slot) => slot.asset).filter((asset) => asset !== undefined);
      if (assets.length) {
        setUploadProgress(t('uploading', { current: 1, total: assets.length }));
        uploadedUrls = await uploadMediaAssets(
          assets,
          () => getSignature().unwrap(),
          (uploaded, total) => setUploadProgress(uploaded >= total ? t('finishing') : t('uploading', { current: uploaded + 1, total })),
        );
      }

      await createListing({
        cropId: crop._id,
        quantity: Number(quantity),
        variety: variety.trim() || undefined,
        grade,
        unit,
        description: description.trim() || undefined,
        mediaUrls: uploadedUrls,
        farmAddress: location.farmAddress.trim(),
        farmState: location.farmState.trim() || undefined,
        farmDistrict: location.farmDistrict.trim() || undefined,
        lat: location.lat,
        lng: location.lng,
      }).unwrap();

      router.replace('/(kisan)/listings');
    } catch (error) {
      // Never leave uploaded files behind if the listing itself failed to save.
      if (uploadedUrls.length) await cleanupMedia({ mediaUrls: uploadedUrls }).unwrap().catch(() => undefined);
      // Failed mutations are already toasted by errorToastMiddleware; only the
      // media upload throws a plain Error that nothing else reports.
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setUploadProgress(undefined);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <BackLink label={tListings('title')} />
          <Text className="text-3xl font-extrabold text-stone-900 dark:text-stone-50">{t('title')}</Text>
          <Text className="-mt-2 text-stone-500 dark:text-stone-400">{t('subtitle')}</Text>

          <Card>
            <SectionTitle>{t('crop')}</SectionTitle>
            <CropSelector value={crop} onChange={(selected) => { setCrop(selected); setErrors((prev) => ({ ...prev, crop: '' })); }} />
            {errors.crop ? <Text className="mt-2 text-xs font-semibold text-red-700 dark:text-red-400">{errors.crop}</Text> : null}

            <Field label={t('variety')}>
              <Input value={variety} onChangeText={setVariety} placeholder="Sharbati, Pusa Basmati" />
            </Field>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Field label={t('quantity')} error={errors.quantity}>
                  <Input value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" placeholder="25" />
                </Field>
              </View>
              <View className="flex-1">
                <Field label={t('unit')}>
                  <Segmented options={UNITS} value={unit} onChange={setUnit} />
                </Field>
              </View>
            </View>

            <Field label={t('grade')} hint={t('gradeHint')}>
              <Segmented options={GRADES} value={grade} onChange={setGrade} />
            </Field>

            <Field label={t('notes')}>
              <Input
                value={description}
                onChangeText={setDescription}
                placeholder={t('notesPlaceholder')}
                multiline
                className="h-24 pt-3"
                style={{ textAlignVertical: 'top' }}
              />
            </Field>
          </Card>

          <MandiRateCard cropId={crop?._id} />

          <Card>
            <SectionTitle>{t('photos')}</SectionTitle>
            <MediaGrid slots={media} onChange={setMedia} disabled={busy} />
          </Card>

          <Card>
            <SectionTitle>{t('location')}</SectionTitle>
            <LocationPicker value={location} onChange={(next) => { setLocation(next); setErrors((prev) => ({ ...prev, address: '' })); }} />
            {errors.address ? <Text className="mt-2 text-xs font-semibold text-red-700 dark:text-red-400">{errors.address}</Text> : null}
          </Card>

          {uploadProgress ? (
            <Text className="text-center text-sm font-semibold text-primary">{uploadProgress}</Text>
          ) : null}

          <Button label={t('publish')} icon="checkmark-circle-outline" loading={busy} onPress={submit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
