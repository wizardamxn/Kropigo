import { ScrollView, Text, View } from 'react-native';
import { CachedImage } from '@/components/CachedImage';
import { useLocalSearchParams } from 'expo-router';
import { useTranslations } from 'use-intl';
import { useGetOrderQuery } from '@/store/ordersApi';
import type { Listing } from '@/store/marketplaceApi';
import { useStatusMeta } from '@/lib/statusHelper';
import { OrderTimeline, orderCropName, orderThumbnail } from '@/components/OrderViews';
import { buildInvoiceHtml, sharePdf } from '@/lib/pdf';
import { rupees } from '@/lib/format';
import { BackLink, Badge, Button, Card, ErrorState, KeyValueRow, Loading, Screen } from '@/components/ui';

export default function KisanOrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTranslations('mobile.orders');
  const tErrors = useTranslations('mobile.errors');
  const tActions = useTranslations('mobile.actions');
  // Hooks must run before any early return.
  const statusMeta = useStatusMeta();
  const { data, isLoading, isError, refetch } = useGetOrderQuery(id);

  if (isLoading) return <Screen><Loading /></Screen>;
  if (isError || !data?.data) {
    return <Screen><ErrorState message={tErrors('loadOrder')} onRetry={refetch} /></Screen>;
  }

  const order = data.data;
  const listing = typeof order.listingId === 'string' ? undefined : (order.listingId as Listing);
  const buyer = typeof order.buyerId === 'string' ? undefined : order.buyerId;
  const meta = statusMeta(order.status);
  const thumbnail = orderThumbnail(order);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }}>
        <BackLink label={t('title')} />

        <Card>
          <View className="flex-row gap-3">
            <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-green-50 dark:bg-green-950">
              {thumbnail ? <CachedImage source={{ uri: thumbnail }} className="h-full w-full" /> : <Text className="text-2xl">🌱</Text>}
            </View>
            <View className="flex-1">
              <Text className="text-xl font-extrabold text-stone-900 dark:text-stone-50">{orderCropName(order)}</Text>
              <View className="mt-1 flex-row">
                <Badge label={meta.label} className={meta.badgeClassName} />
              </View>
            </View>
          </View>

          <View className="mt-4 border-t border-stone-100 pt-3 dark:border-stone-800">
            <KeyValueRow label={t('agreedPrice')} value={`${rupees(order.agreedPrice)} / ${order.unit}`} />
            <KeyValueRow label={t('quantity')} value={`${order.quantity} ${order.unit}`} />
            <KeyValueRow label={t('youEarn')} value={rupees(order.totalAmount)} strong />
            <KeyValueRow label={t('buyer')} value={buyer?.name ?? 'KropiGo'} />
            {buyer?.phone ? <KeyValueRow label={t('contact')} value={buyer.phone} /> : null}
            <KeyValueRow label={t('confirmedOn')} value={new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
          </View>
        </Card>

        {listing?.farmAddress ? (
          <Card>
            <Text className="text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">{t('pickupLocation')}</Text>
            <Text className="mt-1 text-base font-bold text-stone-800 dark:text-stone-200">{listing.farmAddress}</Text>
            <Text className="mt-0.5 text-stone-500 dark:text-stone-400">{listing.farmDistrict}, {listing.farmState}</Text>
          </Card>
        ) : null}

        <OrderTimeline order={order} />

        {order.status === 'delivered' ? (
          <Button
            label={tActions('downloadInvoice')}
            icon="document-text-outline"
            onPress={() => sharePdf(buildInvoiceHtml(order), `KropiGo-invoice-${order._id.slice(-6)}.pdf`)}
          />
        ) : (
          <Text className="px-1 text-center text-xs text-stone-500 dark:text-stone-400">{t('invoiceLater')}</Text>
        )}
      </ScrollView>
    </Screen>
  );
}
