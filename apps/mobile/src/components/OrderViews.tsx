import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslations } from 'use-intl';
import type { Order } from '@/store/ordersApi';
import type { Listing } from '@/store/marketplaceApi';
import { orderStatusOrder, useStatusMeta } from '@/lib/statusHelper';
import { rupees } from '@/lib/format';
import { Badge, Card, ListRow, SectionTitle } from '@/components/ui';

export const orderCropName = (order: Order): string => {
  const listing = typeof order.listingId === 'string' ? undefined : (order.listingId as Listing);
  return listing && typeof listing.cropId !== 'string' ? listing.cropId.name : 'Crop';
};

export const orderThumbnail = (order: Order): string | undefined => {
  const listing = typeof order.listingId === 'string' ? undefined : (order.listingId as Listing);
  return listing?.mediaUrls?.[0];
};

/** One row in the orders list. `counterparty` is the other side of the deal. */
export function OrderCard({ order, href, counterpartyLabel }: {
  order: Order;
  href: '/(kisan)/orders/[id]' | '/(buyer)/orders/[id]';
  counterpartyLabel: string;
}) {
  const meta = useStatusMeta()(order.status);
  const thumbnail = orderThumbnail(order);
  const party = href.includes('kisan')
    ? (typeof order.buyerId === 'string' ? undefined : order.buyerId)
    : (typeof order.sellerId === 'string' ? undefined : order.sellerId);

  return (
    <ListRow
      media={thumbnail}
      title={orderCropName(order)}
      badge={<Badge label={meta.label} className={meta.badgeClassName} />}
      onPress={() => router.push({ pathname: href, params: { id: order._id } })}
    >
      <Text className="mt-1 font-semibold text-stone-700 dark:text-stone-300" numberOfLines={1}>
        {rupees(order.totalAmount)} · {order.quantity} {order.unit}
      </Text>
      <Text className="mt-1 text-xs text-stone-500 dark:text-stone-400" numberOfLines={1}>
        {counterpartyLabel}: {party?.name ?? 'KropiGo user'}
      </Text>
    </ListRow>
  );
}

/**
 * Vertical progress timeline. A qc_failed order stops at the QC step and gets a
 * dedicated red panel — it never reaches the delivery steps.
 */
export function OrderTimeline({ order }: { order: Order }) {
  const t = useTranslations('mobile.orders');
  const statusMeta = useStatusMeta();
  const failed = order.status === 'qc_failed';
  const currentIndex = failed
    ? orderStatusOrder.indexOf('qc_scheduled')
    : orderStatusOrder.indexOf(order.status);

  return (
    <Card>
      <SectionTitle>{t('progress')}</SectionTitle>
      {orderStatusOrder.map((step, index) => {
        const done = index <= currentIndex;
        const isLast = index === orderStatusOrder.length - 1;
        const entry = order.timeline?.find((item) => item.status === step);
        return (
          <View key={step} className="flex-row gap-3">
            <View className="items-center">
              <View className={`h-3 w-3 rounded-full ${done ? 'bg-primary' : 'bg-stone-300 dark:bg-stone-700'}`} />
              {!isLast && (
                <View
                  className={`w-[2px] flex-1 ${done ? 'bg-primary' : 'bg-stone-200 dark:bg-stone-800'}`}
                  style={{ minHeight: 28 }}
                />
              )}
            </View>
            <View className="flex-1 pb-4">
              <Text className={`font-bold ${done ? 'text-stone-900 dark:text-stone-50' : 'text-stone-400 dark:text-stone-600'}`}>
                {statusMeta(step).label}
              </Text>
              {entry ? (
                <Text className="text-xs text-stone-500 dark:text-stone-400">
                  {new Date(entry.timestamp).toLocaleString()}
                </Text>
              ) : null}
              {entry?.note ? <Text className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">{entry.note}</Text> : null}
            </View>
          </View>
        );
      })}
      {failed ? (
        <View className="mt-1 rounded-xl bg-red-50 p-3 dark:bg-red-950">
          <Text className="font-bold text-red-700 dark:text-red-400">{t('qcFailed')}</Text>
          <Text className="mt-1 text-sm text-red-700 dark:text-red-400">
            {order.timeline?.find((item) => item.status === 'qc_failed')?.note ?? t('qcFailedBody')}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}
