import { useMemo, useState } from 'react';
import { RefreshControl, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import MapView, { Callout, Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { useTranslations } from 'use-intl';
import { useGetListingsQuery, useGetListingsForMapQuery, type Listing } from '@/store/marketplaceApi';
import { useDebounced } from '@/hooks/useDebounced';
import { Badge, Chips, EmptyState, ErrorState, Input, ListGap, ListRow, Loading, PageHeader, Screen } from '@/components/ui';

const cropName = (listing: Listing) => (typeof listing.cropId === 'string' ? 'Crop' : listing.cropId.name);

const PAGE_SIZE = 20;

/** India-wide fallback view, matching the web marketplace map. */
const INDIA_REGION: Region = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 25,
  longitudeDelta: 25,
};

type ViewMode = 'grid' | 'map';

/**
 * The marketplace browser. Rendered both inside the buyer tabs and as a public
 * pre-login screen, so it takes navigation as a callback rather than routing itself.
 */
export function MarketplaceList({ onOpenListing, header }: {
  onOpenListing: (id: string) => void;
  header?: React.ReactNode;
}) {
  const t = useTranslations('mobile.marketplace');
  const tErrors = useTranslations('mobile.errors');
  const tLocation = useTranslations('mobile.location');
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<ViewMode>('grid');

  const debouncedDistrict = useDebounced(district, 500);
  const debouncedState = useDebounced(state, 500);
  const filters = {
    district: debouncedDistrict.trim() || undefined,
    state: debouncedState.trim() || undefined,
  };

  const { data, isLoading, isFetching, isError, refetch } = useGetListingsQuery({
    page: 1,
    limit: page * PAGE_SIZE,
    ...filters,
  });

  // The map endpoint is unpaginated and returns only geocoded rows, so it is a
  // separate query rather than a filter over the paginated list.
  const mapQuery = useGetListingsForMapQuery(filters, { skip: view !== 'map' });

  // Crop/variety search is client-side: the listings endpoint has no text filter.
  const term = search.trim().toLowerCase();
  const matchesSearch = (listing: Listing) =>
    !term || `${cropName(listing)} ${listing.variety ?? ''}`.toLowerCase().includes(term);

  const listings = useMemo(() => (data?.data ?? []).filter(matchesSearch), [data, term]);
  const pins = useMemo(
    () => (mapQuery.data?.data ?? []).filter((listing) => listing.farmCoordinates && matchesSearch(listing)),
    [mapQuery.data, term],
  );

  const totalPages = data?.meta?.totalPages ?? 1;
  const canLoadMore = page < totalPages && !search.trim();

  const viewOptions: Array<{ label: string; value: ViewMode }> = [
    { label: t('viewGrid'), value: 'grid' },
    { label: t('viewMap'), value: 'map' },
  ];

  return (
    <Screen>
      <PageHeader title={t('title')} subtitle={t('subtitle')} right={header}>
        <Input
          className="mt-4"
          value={search}
          onChangeText={setSearch}
          placeholder={t('searchPlaceholder')}
          autoCorrect={false}
        />
        <View className="mt-2 flex-row gap-2">
          <Input className="h-10 flex-1" value={district} onChangeText={setDistrict} placeholder={tLocation('district')} autoCorrect={false} />
          <Input className="h-10 flex-1" value={state} onChangeText={setState} placeholder={tLocation('state')} autoCorrect={false} />
        </View>
        <View className="mt-3">
          <Chips options={viewOptions} value={view} onChange={setView} accent="amber" />
        </View>
      </PageHeader>

      {view === 'map' ? (
        mapQuery.isLoading ? (
          <Loading accent="amber" />
        ) : mapQuery.isError ? (
          <ErrorState message={tErrors('loadMarketplace')} onRetry={mapQuery.refetch} accent="amber" />
        ) : (
          <View className="flex-1">
            <MapView
              provider={PROVIDER_GOOGLE}
              style={{ flex: 1 }}
              initialRegion={
                pins[0]?.farmCoordinates
                  ? {
                      latitude: pins[0].farmCoordinates.lat,
                      longitude: pins[0].farmCoordinates.lng,
                      latitudeDelta: 4,
                      longitudeDelta: 4,
                    }
                  : INDIA_REGION
              }
            >
              {pins.map((listing) => (
                <Marker
                  key={listing._id}
                  coordinate={{ latitude: listing.farmCoordinates!.lat, longitude: listing.farmCoordinates!.lng }}
                  // Android renders callout children as a flat snapshot, so the tap
                  // has to be handled on the marker rather than inside the bubble.
                  onCalloutPress={() => onOpenListing(listing._id)}
                >
                  <Callout tooltip={false}>
                    <View style={{ minWidth: 170, padding: 2 }}>
                      <Text style={{ fontWeight: '700', color: '#1c1917' }}>
                        {cropName(listing)}{listing.variety ? ` (${listing.variety})` : ''}
                      </Text>
                      <Text style={{ marginTop: 2, fontSize: 12, color: '#57534e' }}>
                        {t('available', { quantity: listing.quantity, unit: listing.unit })}
                      </Text>
                      <Text style={{ marginTop: 2, fontSize: 12, color: '#78716c' }}>
                        {[listing.farmDistrict, listing.farmState].filter(Boolean).join(', ')}
                      </Text>
                      <Text style={{ marginTop: 6, fontSize: 12, fontWeight: '700', color: '#166534' }}>
                        {t('viewListing')}
                      </Text>
                    </View>
                  </Callout>
                </Marker>
              ))}
            </MapView>

            {pins.length === 0 ? (
              <View className="absolute bottom-4 left-4 right-4 rounded-xl bg-white/95 p-3 dark:bg-stone-900/95">
                <Text className="text-center text-sm text-stone-600 dark:text-stone-300">{t('noPins')}</Text>
              </View>
            ) : null}
          </View>
        )
      ) : isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState message={tErrors('loadMarketplace')} onRetry={refetch} />
      ) : (
        <FlashList
          data={listings}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 14 }}
          ItemSeparatorComponent={ListGap}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#166534" />}
          onEndReachedThreshold={0.4}
          onEndReached={() => { if (canLoadMore && !isFetching) setPage((prev) => prev + 1); }}
          ListEmptyComponent={
            <EmptyState icon="storefront-outline" title={t('empty')} subtitle={t('emptyHint')} />
          }
          ListFooterComponent={
            canLoadMore && isFetching ? <Text className="py-4 text-center text-xs text-stone-400">…</Text> : null
          }
          renderItem={({ item }) => <ListingCard listing={item} onPress={() => onOpenListing(item._id)} />}
        />
      )}
    </Screen>
  );
}

function ListingCard({ listing, onPress }: Readonly<{ listing: Listing; onPress: () => void }>) {
  const t = useTranslations('mobile.marketplace');
  const seller = typeof listing.sellerId === 'string' ? undefined : listing.sellerId;

  return (
    <ListRow
      media={listing.mediaUrls?.[0]}
      title={`${cropName(listing)}${listing.variety ? ` · ${listing.variety}` : ''}`}
      badge={<Badge label={t('grade', { grade: listing.grade })} className="bg-green-100 text-primary dark:bg-green-900 dark:text-green-400" />}
      onPress={onPress}
    >
      <Text className="mt-1 font-semibold text-stone-700 dark:text-stone-300" numberOfLines={1}>
        {t('available', { quantity: listing.quantity, unit: listing.unit })}
      </Text>
      <Text className="mt-1 text-xs text-stone-500 dark:text-stone-400" numberOfLines={1}>
        {listing.farmDistrict}, {listing.farmState}
      </Text>
      <Text className="mt-1 text-xs font-semibold text-primary" numberOfLines={1}>
        {seller?.isVerified ? `✓ ${t('verifiedFarmer')} · ` : ''}{seller?.name ?? t('farmer')}
      </Text>
    </ListRow>
  );
}
