import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslations } from 'use-intl';
import {
  useAcceptInterestMutation,
  useGetListingInterestsQuery,
  useGetListingQuery,
  useRejectInterestMutation,
  type Interest,
} from '@/store/marketplaceApi';
import { statusBadgeClass, useStatusMeta } from '@/lib/statusHelper';
import { PhotoCarousel } from '@/components/marketplace/PhotoCarousel';
import { MandiRateCard } from '@/components/listing/MandiRateCard';
import { rupees } from '@/lib/format';
import { BackLink, Badge, Button, Card, ErrorState, Loading, Screen, SectionTitle } from '@/components/ui';

export default function KisanListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTranslations('mobile.listings');
  const tErrors = useTranslations('mobile.errors');
  const tActions = useTranslations('mobile.actions');
  const tOffer = useTranslations('mobile.offer');
  // Hooks must run before any early return.
  const statusMeta = useStatusMeta();
  const { data, isLoading, isError, refetch } = useGetListingQuery(id);
  const { data: interestsData, isFetching: isInterestsLoading } = useGetListingInterestsQuery(id);

  if (isLoading) return <Screen><Loading /></Screen>;
  if (isError || !data?.data) {
    return <Screen><ErrorState message={tErrors('loadListing')} onRetry={refetch} /></Screen>;
  }

  const listing = data.data;
  const crop = typeof listing.cropId === 'string' ? 'Crop' : listing.cropId.name;
  const cropId = typeof listing.cropId === 'string' ? listing.cropId : listing.cropId._id;
  const meta = statusMeta(listing.status);
  const interests = interestsData?.data ?? [];
  // Pending offers first — those are the ones needing a decision.
  const pending = interests.filter((interest) => interest.status === 'pending');
  const resolved = interests.filter((interest) => interest.status !== 'pending');
  const canEdit = listing.status === 'draft' || listing.status === 'open';

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
        <BackLink label={t('title')} />

        <PhotoCarousel urls={listing.mediaUrls} />

        <Card>
          <View className="flex-row justify-between gap-2">
            <Text className="flex-1 text-2xl font-extrabold text-stone-900 dark:text-stone-50">
              {crop}{listing.variety ? ` · ${listing.variety}` : ''}
            </Text>
            <Badge label={meta.label} className={meta.badgeClassName} />
          </View>
          <Text className="mt-2 text-base font-bold text-primary">
            {listing.quantity} {listing.unit} · {listing.grade}
          </Text>
          <Text className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            {listing.viewCount ?? 0} · {t('offers', { count: listing.interestedBuyerCount ?? 0 })}
          </Text>
          {listing.description ? (
            <Text className="mt-3.5 leading-[21px] text-stone-500 dark:text-stone-400">{listing.description}</Text>
          ) : null}

          {canEdit ? (
            <View className="mt-4">
              <Button
                label={tActions('edit')}
                variant="outline"
                icon="create-outline"
                onPress={() => router.push({ pathname: '/(kisan)/listings/edit/[id]', params: { id: listing._id } })}
              />
            </View>
          ) : null}
        </Card>

        <MandiRateCard cropId={cropId} />

        <View>
          <SectionTitle>{t('offers', { count: interests.length })}</SectionTitle>
          {isInterestsLoading ? (
            <ActivityIndicator color="#166534" />
          ) : interests.length === 0 ? (
            <Card>
              <Text className="text-stone-500 dark:text-stone-400">{tOffer('make')} — {t('emptyHint')}</Text>
            </Card>
          ) : (
            <View className="gap-3">
              {pending.map((interest) => (
                <InterestCard key={interest._id} interest={interest} listingId={listing._id} unit={listing.unit} actionable />
              ))}
              {resolved.map((interest) => (
                <InterestCard key={interest._id} interest={interest} listingId={listing._id} unit={listing.unit} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function InterestCard({ interest, listingId, unit, actionable = false }: Readonly<{
  interest: Interest; listingId: string; unit: string; actionable?: boolean;
}>) {
  const tStatus = useTranslations('status');
  const tActions = useTranslations('mobile.actions');
  const [accept, { isLoading: isAccepting }] = useAcceptInterestMutation();
  const [reject, { isLoading: isRejecting }] = useRejectInterestMutation();
  const buyer = typeof interest.buyerId === 'string' ? undefined : interest.buyerId;
  const busy = isAccepting || isRejecting;

  const onAccept = () => {
    Alert.alert(tStatus('accepted'), 'This confirms the sale and rejects all other pending offers.', [
      { text: tActions('cancel'), style: 'cancel' },
      {
        text: tStatus('accepted'),
        onPress: async () => {
          try {
            await accept({ listingId, interestId: interest._id }).unwrap();
            router.push('/(kisan)/orders');
          } catch {
            // errorToastMiddleware already surfaced the failure.
          }
        },
      },
    ]);
  };

  const onReject = () => {
    Alert.alert(tStatus('rejected'), undefined, [
      { text: tActions('cancel'), style: 'cancel' },
      {
        text: tStatus('rejected'),
        style: 'destructive',
        // Failures surface through errorToastMiddleware.
        onPress: () => { void reject({ listingId, interestId: interest._id }).unwrap().catch(() => undefined); },
      },
    ]);
  };

  return (
    <Card>
      <View className="flex-row justify-between gap-2">
        <View className="flex-1">
          <Text className="text-base font-extrabold text-stone-900 dark:text-stone-50" numberOfLines={1}>
            {buyer?.isVerified ? '✓ ' : ''}{buyer?.name ?? 'Buyer'}
          </Text>
          {buyer?.location ? <Text className="text-xs text-stone-500 dark:text-stone-400">{buyer.location}</Text> : null}
        </View>
        <Badge label={tStatus(interest.status)} className={statusBadgeClass[interest.status]} />
      </View>

      <Text className="mt-2.5 text-lg font-extrabold text-primary">
        {rupees(interest.price)}{' '}
        <Text className="text-sm font-normal text-stone-500 dark:text-stone-400">/ {unit}</Text>
      </Text>
      {interest.quantity ? (
        <Text className="text-xs text-stone-500 dark:text-stone-400">{interest.quantity} {unit}</Text>
      ) : null}
      {interest.notes ? (
        <Text className="mt-1.5 text-stone-600 dark:text-stone-300">&ldquo;{interest.notes}&rdquo;</Text>
      ) : null}

      {actionable ? (
        <View className="mt-4 flex-row gap-2.5">
          <View className="flex-1">
            <Button label={tStatus('accepted')} loading={isAccepting} disabled={busy} onPress={onAccept} />
          </View>
          <View className="flex-1">
            <Button label={tStatus('rejected')} variant="danger" loading={isRejecting} disabled={busy} onPress={onReject} />
          </View>
        </View>
      ) : null}
    </Card>
  );
}
