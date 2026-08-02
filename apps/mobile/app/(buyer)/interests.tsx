import { useState } from 'react';
import { Pressable, RefreshControl, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useTranslations } from 'use-intl';
import { useGetMyInterestsQuery, useWithdrawInterestMutation, type Interest, type Listing } from '@/store/marketplaceApi';
import { statusBadgeClass } from '@/lib/statusHelper';
import { rupees } from '@/lib/format';
import { Badge, Card, Chips, EmptyState, ErrorState, ListGap, Loading, PageHeader, Screen } from '@/components/ui';

const STATUS_FILTERS: Array<Interest['status'] | undefined> = [undefined, 'pending', 'accepted', 'rejected', 'withdrawn'];

export default function Interests() {
  const t = useTranslations('mobile.buyerDashboard');
  const tActions = useTranslations('mobile.actions');
  const tStatus = useTranslations('status');
  const tErrors = useTranslations('mobile.errors');
  const [status, setStatus] = useState<Interest['status']>();
  const { data, isLoading, isFetching, isError, refetch } = useGetMyInterestsQuery(status ? { status } : undefined);
  const interests = data?.data ?? [];

  const filters = STATUS_FILTERS.map((value) => ({
    label: value ? tStatus(value) : tActions('viewAll'),
    value,
  }));

  return (
    <Screen>
      <PageHeader title={t('myOffers')} subtitle={t('myOffersHint', { count: interests.filter((i) => i.status === 'pending').length })}>
        <View className="mt-4">
          <Chips options={filters} value={status} onChange={setStatus} accent="amber" />
        </View>
      </PageHeader>

      {isLoading ? (
        <Loading accent="amber" />
      ) : isError ? (
        <ErrorState message={tErrors('loadMarketplace')} onRetry={refetch} accent="amber" />
      ) : (
        <FlashList
          data={interests}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 14 }}
          ItemSeparatorComponent={ListGap}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#b45309" />}
          ListEmptyComponent={<EmptyState icon="pricetags-outline" title={t('noOrders')} subtitle={t('noOrdersHint')} />}
          renderItem={({ item }) => <InterestCard interest={item} />}
        />
      )}
    </Screen>
  );
}

function InterestCard({ interest }: Readonly<{ interest: Interest }>) {
  const tStatus = useTranslations('status');
  const tOffer = useTranslations('mobile.offer');
  const tListing = useTranslations('mobile.listingDetail');
  const [withdraw, { isLoading }] = useWithdrawInterestMutation();
  const listing = typeof interest.listingId === 'string' ? undefined : (interest.listingId as Listing);
  const crop = listing && typeof listing.cropId !== 'string' ? listing.cropId.name : 'Crop';
  const listingId = listing?._id;
  const cancel = () => { if (listingId) withdraw({ listingId, interestId: interest._id }).unwrap().catch(() => undefined); };

  return (
    <Card>
      <View className="flex-row justify-between gap-2">
        <View className="flex-1">
          <Text className="text-[17px] font-extrabold text-stone-900 dark:text-stone-50" numberOfLines={1}>{crop}</Text>
          {listing ? <Text className="text-xs text-stone-500 dark:text-stone-400">{listing.quantity} {listing.unit}</Text> : null}
        </View>
        <Badge label={tStatus(interest.status)} className={statusBadgeClass[interest.status]} />
      </View>
      <Text className="mt-3.5 text-lg font-extrabold text-primary">
        {rupees(interest.price)}{' '}
        <Text className="text-sm font-normal text-stone-500 dark:text-stone-400">/ {listing?.unit ?? 'unit'}</Text>
      </Text>
      {interest.quantity ? <Text className="text-xs text-stone-500 dark:text-stone-400">{interest.quantity} {listing?.unit}</Text> : null}
      <View className="mt-[15px] flex-row gap-5 border-t border-stone-100 pt-3 dark:border-stone-800">
        {listingId ? (
          <Pressable onPress={() => router.push({ pathname: '/(buyer)/marketplace/[id]', params: { id: listingId } })}>
            <Text className="font-bold text-primary">{tListing('pickup')}</Text>
          </Pressable>
        ) : null}
        {interest.status === 'pending' ? (
          <Pressable disabled={isLoading} onPress={cancel}>
            <Text className="font-bold text-red-700 dark:text-red-400">{tOffer('withdraw')}</Text>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}
