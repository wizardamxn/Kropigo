import { useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useTranslations } from 'use-intl';
import { useGetOrdersQuery, type OrderStatus } from '@/store/ordersApi';
import { OrderCard } from '@/components/OrderViews';
import { Button, Chips, EmptyState, ErrorState, ListGap, Loading, PageHeader, Screen } from '@/components/ui';

const STATUS_FILTERS: Array<{ key: string; value: OrderStatus | undefined }> = [
  { key: 'filterAll', value: undefined },
  { key: 'filterConfirmed', value: 'sale_confirmed' },
  { key: 'filterQc', value: 'qc_scheduled' },
  { key: 'filterTransit', value: 'in_transit' },
  { key: 'filterDelivered', value: 'delivered' },
];

export default function BuyerOrders() {
  const t = useTranslations('mobile.orders');
  const tMarket = useTranslations('mobile.marketplace');
  const tErrors = useTranslations('mobile.errors');
  const [status, setStatus] = useState<OrderStatus | undefined>();
  const { data, isLoading, isFetching, isError, refetch } = useGetOrdersQuery({ limit: 100, status });
  const orders = data?.data ?? [];
  const filters = STATUS_FILTERS.map((filter) => ({ label: t(filter.key), value: filter.value }));

  return (
    <Screen>
      <PageHeader title={t('title')} subtitle={t('subtitleBuyer')}>
        <View className="mt-4">
          <Chips options={filters} value={status} onChange={setStatus} accent="amber" />
        </View>
      </PageHeader>

      {isLoading ? (
        <Loading accent="amber" />
      ) : isError ? (
        <ErrorState message={tErrors('loadOrders')} onRetry={refetch} accent="amber" />
      ) : (
        <FlashList
          data={orders}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 14 }}
          ItemSeparatorComponent={ListGap}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#b45309" />}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title={status ? t('emptyFiltered') : t('empty')}
              subtitle={t('emptyHintBuyer')}
              action={
                status ? undefined : (
                  <Button label={tMarket('title')} accent="amber" icon="storefront-outline" onPress={() => router.push('/(buyer)/marketplace')} />
                )
              }
            />
          }
          renderItem={({ item }) => <OrderCard order={item} href="/(buyer)/orders/[id]" counterpartyLabel={t('farmer')} />}
        />
      )}
    </Screen>
  );
}
