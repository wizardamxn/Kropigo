import { useState } from 'react';
import { Alert, Pressable, RefreshControl, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslations } from 'use-intl';
import { useDeleteListingMutation, useGetListingsQuery, type Listing, type ListingStatus } from '@/store/marketplaceApi';
import { useAppSelector } from '@/store/hooks';
import { useStatusMeta } from '@/lib/statusHelper';
import { Badge, Button, Chips, EmptyState, ErrorState, ListGap, ListRow, Loading, PageHeader, Screen } from '@/components/ui';

const STATUS_FILTERS: Array<ListingStatus | undefined> = [undefined, 'open', 'interest_received', 'sale_confirmed', 'draft'];

export default function KisanListings() {
  const t = useTranslations('mobile.listings');
  const tStatus = useTranslations('status');
  const tErrors = useTranslations('mobile.errors');
  const tActions = useTranslations('mobile.actions');
  const user = useAppSelector((state) => state.auth.user);
  const [status, setStatus] = useState<ListingStatus | undefined>();

  const filters = STATUS_FILTERS.map((value) => ({
    label: value ? tStatus(value) : tActions('viewAll'),
    value,
  }));
  const { data, isLoading, isFetching, isError, refetch } = useGetListingsQuery(
    user ? { sellerId: user.id, limit: 100, status } : undefined,
    { skip: !user },
  );
  const listings = data?.data ?? [];

  return (
    <Screen>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        right={
          <Pressable
            onPress={() => router.push('/(kisan)/listings/create')}
            className="h-11 w-11 items-center justify-center rounded-full bg-primary active:opacity-90"
          >
            <Ionicons name="add" size={24} color="#ffffff" />
          </Pressable>
        }
      >
        <View className="mt-4">
          <Chips options={filters} value={status} onChange={setStatus} />
        </View>
      </PageHeader>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState message={tErrors('loadListings')} onRetry={refetch} />
      ) : (
        <FlashList
          data={listings}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 14 }}
          ItemSeparatorComponent={ListGap}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#166534" />}
          ListEmptyComponent={
            <EmptyState
              icon="leaf-outline"
              title={status ? t('emptyFiltered') : t('empty')}
              subtitle={t('emptyHint')}
              action={<Button label={tActions('create')} icon="add" onPress={() => router.push('/(kisan)/listings/create')} />}
            />
          }
          renderItem={({ item }) => <ListingCard listing={item} />}
        />
      )}
    </Screen>
  );
}

function ListingCard({ listing }: Readonly<{ listing: Listing }>) {
  const t = useTranslations('mobile.listings');
  const tActions = useTranslations('mobile.actions');
  const statusMeta = useStatusMeta();
  const [deleteListing, { isLoading: isDeleting }] = useDeleteListingMutation();
  const crop = typeof listing.cropId === 'string' ? 'Crop' : listing.cropId.name;
  const meta = statusMeta(listing.status);
  const canEdit = listing.status === 'draft' || listing.status === 'open';
  const offers = listing.interestCount ?? 0;

  const confirmDelete = () => {
    Alert.alert(t('deleteTitle'), t('deleteBody'), [
      { text: tActions('cancel'), style: 'cancel' },
      {
        text: tActions('delete'),
        style: 'destructive',
        // Failures surface through errorToastMiddleware.
        onPress: () => { void deleteListing(listing._id).unwrap().catch(() => undefined); },
      },
    ]);
  };

  return (
    <ListRow
      media={listing.mediaUrls?.[0]}
      title={`${crop}${listing.variety ? ` · ${listing.variety}` : ''}`}
      badge={<Badge label={meta.label} className={meta.badgeClassName} />}
      onPress={() => router.push({ pathname: '/(kisan)/listings/[id]', params: { id: listing._id } })}
    >
      <Text className="mt-1 font-semibold text-stone-700 dark:text-stone-300" numberOfLines={1}>
        {listing.quantity} {listing.unit}
      </Text>
      {offers > 0 ? (
        <Text className="mt-1 text-xs font-bold text-amber-600 dark:text-amber-400">
          {t('offers', { count: offers })}
        </Text>
      ) : null}

      {canEdit ? (
        <View className="mt-2 flex-row gap-4">
          <Pressable
            hitSlop={6}
            onPress={() => router.push({ pathname: '/(kisan)/listings/edit/[id]', params: { id: listing._id } })}
          >
            <Text className="text-xs font-bold text-primary">{tActions('edit')}</Text>
          </Pressable>
          <Pressable hitSlop={6} disabled={isDeleting} onPress={confirmDelete}>
            <Text className="text-xs font-bold text-red-700 dark:text-red-400">{tActions('delete')}</Text>
          </Pressable>
        </View>
      ) : null}
    </ListRow>
  );
}
