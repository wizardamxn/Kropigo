import { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslations } from 'use-intl';
import { useGetOrdersQuery } from '@/store/ordersApi';
import { useGetMyInterestsQuery } from '@/store/marketplaceApi';
import { useAppSelector } from '@/store/hooks';
import { OrderCard } from '@/components/OrderViews';
import { rupees } from '@/lib/format';
import { Card, EmptyState, PageHeader, Screen, SectionTitle, StatCard } from '@/components/ui';

/** Statuses that mean the deal is financially committed. */
const SETTLED: string[] = ['qc_passed', 'pickup_scheduled', 'in_transit', 'delivered'];

export default function BuyerDashboard() {
  const t = useTranslations('mobile.buyerDashboard');
  const tActions = useTranslations('mobile.actions');
  const tOrders = useTranslations('mobile.orders');
  const user = useAppSelector((state) => state.auth.user);
  const { data: ordersData, isFetching: ordersFetching, refetch: refetchOrders } = useGetOrdersQuery({ page: 1, limit: 100 });
  const { data: interestsData, isFetching: interestsFetching, refetch: refetchInterests } = useGetMyInterestsQuery();

  const orders = useMemo(() => ordersData?.data ?? [], [ordersData]);
  const interests = useMemo(() => interestsData?.data ?? [], [interestsData]);

  const stats = useMemo(() => ({
    pending: interests.filter((interest) => interest.status === 'pending').length,
    accepted: interests.filter((interest) => interest.status === 'accepted').length,
    active: orders.filter((order) => !['delivered', 'qc_failed'].includes(order.status)).length,
    spent: orders.filter((order) => SETTLED.includes(order.status)).reduce((sum, order) => sum + (order.totalAmount ?? 0), 0),
  }), [interests, orders]);

  const refresh = () => { refetchOrders(); refetchInterests(); };

  return (
    <Screen>
      <PageHeader title={t('title')} subtitle={`${t('welcome')}${user?.name ? `, ${user.name}` : ''}`} />

      <ScrollView
        contentContainerStyle={{ padding: 14, gap: 14, paddingBottom: 28 }}
        refreshControl={<RefreshControl refreshing={ordersFetching || interestsFetching} onRefresh={refresh} tintColor="#b45309" />}
      >
        <View className="flex-row gap-3">
          <StatCard label={t('pendingOffers')} value={stats.pending} accent="amber" />
          <StatCard label={t('acceptedDeals')} value={stats.accepted} accent="amber" />
        </View>
        <View className="flex-row gap-3">
          <StatCard label={t('activeOrders')} value={stats.active} accent="amber" />
          <StatCard label={t('totalSpent')} value={rupees(stats.spent)} accent="amber" />
        </View>

        <QuickLink
          icon="storefront-outline"
          title={t('browse')}
          subtitle={t('browseHint')}
          onPress={() => router.push('/(buyer)/marketplace')}
          primary
        />
        <QuickLink
          icon="pricetags-outline"
          title={t('myOffers')}
          subtitle={t('myOffersHint', { count: stats.pending })}
          onPress={() => router.push('/(buyer)/interests')}
        />

        <View>
          <View className="mb-3 flex-row items-center justify-between">
            <SectionTitle>{t('recentOrders')}</SectionTitle>
            <Pressable onPress={() => router.push('/(buyer)/orders')} className="pb-3">
              <Text className="font-bold text-amber-700 dark:text-amber-500">{tActions('viewAll')}</Text>
            </Pressable>
          </View>
          {orders.length === 0 ? (
            <Card>
              <EmptyState icon="receipt-outline" title={t('noOrders')} subtitle={t('noOrdersHint')} />
            </Card>
          ) : (
            <View className="gap-3">
              {orders.slice(0, 4).map((order) => (
                <OrderCard key={order._id} order={order} href="/(buyer)/orders/[id]" counterpartyLabel={tOrders('farmer')} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function QuickLink({ icon, title, subtitle, onPress, primary }: {
  icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; onPress: () => void; primary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3.5 rounded-2xl p-4 active:opacity-90 ${
        primary ? 'bg-amber-700 dark:bg-amber-600' : 'border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900'
      }`}
    >
      <View className={`h-12 w-12 items-center justify-center rounded-xl ${primary ? 'bg-white/20' : 'bg-stone-100 dark:bg-stone-800'}`}>
        <Ionicons name={icon} size={22} color={primary ? '#ffffff' : '#78716c'} />
      </View>
      <View className="flex-1">
        <Text className={`text-base font-bold ${primary ? 'text-white' : 'text-stone-800 dark:text-stone-100'}`}>{title}</Text>
        <Text className={`text-sm ${primary ? 'text-amber-100' : 'text-stone-500 dark:text-stone-400'}`}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={primary ? '#ffffff' : '#a8a29e'} />
    </Pressable>
  );
}
