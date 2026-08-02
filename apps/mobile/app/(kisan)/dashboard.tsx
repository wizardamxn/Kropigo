import { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslations } from 'use-intl';
import { useGetListingsQuery } from '@/store/marketplaceApi';
import { useAppSelector } from '@/store/hooks';
import { Card, ErrorState, PageHeader, Screen, StatCard } from '@/components/ui';

export default function KisanDashboard() {
  const t = useTranslations('mobile.kisanDashboard');
  const tListings = useTranslations('mobile.listings');
  const tStatus = useTranslations('status');
  const tErrors = useTranslations('mobile.errors');
  const user = useAppSelector((state) => state.auth.user);
  const { data, isFetching, isError, refetch } = useGetListingsQuery(
    user ? { sellerId: user.id, limit: 100 } : undefined,
    { skip: !user },
  );

  const stats = useMemo(() => {
    const listings = data?.data ?? [];
    return {
      open: listings.filter((listing) => listing.status === 'open').length,
      offers: listings.filter((listing) => (listing.interestCount ?? 0) > 0).length,
      sold: listings.filter((listing) => listing.status === 'sale_confirmed' || listing.status === 'closed').length,
      draft: listings.filter((listing) => listing.status === 'draft').length,
    };
  }, [data]);

  return (
    <Screen>
      <PageHeader title={`${t('title')} 🌾`} subtitle={user?.name ? user.name : t('subtitle')} />

      <ScrollView
        contentContainerStyle={{ padding: 14, gap: 14, paddingBottom: 28 }}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#166534" />}
      >
        {isError ? (
          <Card><ErrorState message={tErrors('loadListings')} onRetry={refetch} /></Card>
        ) : (
          <>
            <View className="flex-row gap-3">
              <StatCard label={tStatus('open')} value={stats.open} />
              <StatCard label={tStatus('interest_received')} value={stats.offers} accent="amber" />
            </View>
            <View className="flex-row gap-3">
              <StatCard label={tStatus('sale_confirmed')} value={stats.sold} />
              <StatCard label={tStatus('draft')} value={stats.draft} />
            </View>
          </>
        )}

        <QuickLink
          icon="add-circle-outline"
          title={tListings('create')}
          subtitle={tListings('subtitle')}
          onPress={() => router.push('/(kisan)/listings/create')}
          primary
        />
        <QuickLink
          icon="leaf-outline"
          title={tListings('title')}
          subtitle={tStatus('open')}
          onPress={() => router.push('/(kisan)/listings')}
        />
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
        primary ? 'bg-primary' : 'border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900'
      }`}
    >
      <View className={`h-12 w-12 items-center justify-center rounded-xl ${primary ? 'bg-white/20' : 'bg-stone-100 dark:bg-stone-800'}`}>
        <Ionicons name={icon} size={22} color={primary ? '#ffffff' : '#78716c'} />
      </View>
      <View className="flex-1">
        <Text className={`text-base font-bold ${primary ? 'text-white' : 'text-stone-800 dark:text-stone-100'}`}>{title}</Text>
        <Text className={`text-sm ${primary ? 'text-green-100' : 'text-stone-500 dark:text-stone-400'}`} numberOfLines={1}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={primary ? '#ffffff' : '#a8a29e'} />
    </Pressable>
  );
}
