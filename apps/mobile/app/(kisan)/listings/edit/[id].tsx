import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { toast } from 'sonner-native';
import { useTranslations } from 'use-intl';
import { useGetListingQuery, useUpdateListingMutation } from '@/store/marketplaceApi';
import { useDeleteCloudinaryMediaMutation, useGetCloudinarySignatureMutation } from '@/store/mediaApi';
import { uploadMediaAssets } from '@/lib/cloudinaryUpload';
import { MediaGrid, type MediaSlot } from '@/components/listing/MediaGrid';
import { LocationPicker, type LocationValue } from '@/components/listing/LocationPicker';
import { MandiRateCard } from '@/components/listing/MandiRateCard';
import { BackLink, Button, Card, ErrorState, Field, Input, Loading, Screen, SectionTitle, Segmented } from '@/components/ui';

const UNITS = ['kg', 'quintal', 'ton'] as const;
const GRADES = ['A', 'B'] as const;

export default function EditListing() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTranslations('mobile.editListing');
  const tCreate = useTranslations('mobile.createListing');
  const tListings = useTranslations('mobile.listings');
  const tErrors = useTranslations('mobile.errors');
  const tActions = useTranslations('mobile.actions');
  const { data, isLoading, isError, refetch } = useGetListingQuery(id);
  const [updateListing, { isLoading: isSaving }] = useUpdateListingMutation();
  const [getSignature] = useGetCloudinarySignatureMutation();
  const [cleanupMedia] = useDeleteCloudinaryMediaMutation();

  const [quantity, setQuantity] = useState('');
  const [variety, setVariety] = useState('');
  const [unit, setUnit] = useState<(typeof UNITS)[number]>('quintal');
  const [grade, setGrade] = useState<(typeof GRADES)[number]>('A');
  const [description, setDescription] = useState('');
  const [media, setMedia] = useState<MediaSlot[]>([]);
  const [removedUrls, setRemovedUrls] = useState<string[]>([]);
  const [location, setLocation] = useState<LocationValue>({ farmAddress: '', farmState: '', farmDistrict: '' });
  const [hydrated, setHydrated] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>();

  const listing = data?.data;

  // Seed the form once, so refetches never clobber in-progress edits.
  useEffect(() => {
    if (!listing || hydrated) return;
    setQuantity(String(listing.quantity));
    setVariety(listing.variety ?? '');
    setUnit((UNITS as readonly string[]).includes(listing.unit) ? (listing.unit as (typeof UNITS)[number]) : 'quintal');
    setGrade(listing.grade === 'B' ? 'B' : 'A');
    setDescription(listing.description ?? '');
    setMedia((listing.mediaUrls ?? []).map((url) => ({ url })));
    setLocation({
      farmAddress: listing.farmAddress ?? '',
      farmState: listing.farmState ?? '',
      farmDistrict: listing.farmDistrict ?? '',
      // Without these the map would open unpinned and the existing farm location
      // would look lost, even though it is still stored on the listing.
      lat: listing.farmCoordinates?.lat,
      lng: listing.farmCoordinates?.lng,
    });
    setHydrated(true);
  }, [listing, hydrated]);

  if (isLoading) return <Screen><Loading /></Screen>;
  if (isError || !listing) {
    return <Screen><ErrorState message={tErrors('loadListing')} onRetry={refetch} /></Screen>;
  }

  const editable = listing.status === 'draft' || listing.status === 'open';
  const cropName = typeof listing.cropId === 'string' ? 'Crop' : listing.cropId.name;
  const cropId = typeof listing.cropId === 'string' ? listing.cropId : listing.cropId._id;
  const busy = isSaving || uploadProgress !== undefined;

  const onMediaChange = (next: MediaSlot[]) => {
    // Track removals of already-uploaded media so the server can purge them.
    const droppedUrls = media
      .map((slot) => slot.url)
      .filter((url) => url !== undefined)
      .filter((url) => !next.some((slot) => slot.url === url));
    if (droppedUrls.length) setRemovedUrls((prev) => [...prev, ...droppedUrls]);
    setMedia(next);
  };

  const submit = async () => {
    if (!quantity || Number(quantity) <= 0) {
      toast.error(tCreate('errorQuantity'));
      return;
    }

    let uploadedUrls: string[] = [];
    try {
      const assets = media.map((slot) => slot.asset).filter((asset) => asset !== undefined);
      if (assets.length) {
        setUploadProgress(tCreate('uploading', { current: 1, total: assets.length }));
        uploadedUrls = await uploadMediaAssets(
          assets,
          () => getSignature().unwrap(),
          (uploaded, total) => setUploadProgress(uploaded >= total ? tCreate('finishing') : tCreate('uploading', { current: uploaded + 1, total })),
        );
      }

      await updateListing({
        id,
        body: {
          quantity: Number(quantity),
          variety: variety.trim() || undefined,
          grade,
          unit,
          description: description.trim() || undefined,
          farmAddress: location.farmAddress.trim() || undefined,
          farmState: location.farmState.trim() || undefined,
          farmDistrict: location.farmDistrict.trim() || undefined,
          lat: location.lat,
          lng: location.lng,
          mediaUrls: uploadedUrls,
          deletedMediaUrls: removedUrls,
        },
      }).unwrap();

      router.back();
    } catch (error) {
      if (uploadedUrls.length) await cleanupMedia({ mediaUrls: uploadedUrls }).unwrap().catch(() => undefined);
      // Failed mutations are already toasted by errorToastMiddleware; only the
      // media upload throws a plain Error that nothing else reports.
      if (error instanceof Error) toast.error(error.message || tErrors('generic'));
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
          <Text className="-mt-2 text-stone-500 dark:text-stone-400">{cropName}</Text>

          {!editable ? (
            <View className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
              <Text className="font-bold text-amber-800 dark:text-amber-400">{t('locked')}</Text>
              <Text className="mt-1 text-sm text-amber-800 dark:text-amber-400">{t('lockedBody')}</Text>
            </View>
          ) : null}

          <Card>
            <SectionTitle>{t('details')}</SectionTitle>
            <Field label={tCreate('variety')}>
              <Input value={variety} onChangeText={setVariety} placeholder="Sharbati" editable={editable} />
            </Field>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Field label={tCreate('quantity')}>
                  <Input value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" editable={editable} />
                </Field>
              </View>
              <View className="flex-1">
                <Field label={tCreate('unit')}>
                  <Segmented options={UNITS} value={unit} onChange={editable ? setUnit : () => undefined} />
                </Field>
              </View>
            </View>

            <Field label={tCreate('grade')}>
              <Segmented options={GRADES} value={grade} onChange={editable ? setGrade : () => undefined} />
            </Field>

            <Field label={tCreate('notes')}>
              <Input
                value={description}
                onChangeText={setDescription}
                placeholder={tCreate('notesPlaceholder')}
                multiline
                editable={editable}
                className="h-24 pt-3"
                style={{ textAlignVertical: 'top' }}
              />
            </Field>
          </Card>

          <MandiRateCard cropId={cropId} />

          <Card>
            <SectionTitle>{tCreate('photos')}</SectionTitle>
            <MediaGrid slots={media} onChange={onMediaChange} disabled={busy || !editable} />
          </Card>

          <Card>
            <SectionTitle>{tCreate('location')}</SectionTitle>
            <LocationPicker value={location} onChange={setLocation} />
          </Card>

          {uploadProgress ? <Text className="text-center text-sm font-semibold text-primary">{uploadProgress}</Text> : null}

          <Button label={tActions('save')} icon="save-outline" loading={busy} disabled={!editable} onPress={submit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
