import { useMemo } from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useTranslations } from 'use-intl';
import { RoleGate } from '@/components/RoleGate';
import { useAppSelector } from '@/store/hooks';
import { makeTabIcon } from '@/components/TabIcon';

// Defined once at module scope so each is a permanently stable reference —
// see TabIcon.tsx for why that matters.
const DashboardIcon = makeTabIcon('grid-outline');
const ListingsIcon = makeTabIcon('leaf-outline');
const OrdersIcon = makeTabIcon('receipt-outline');
const StatementsIcon = makeTabIcon('document-text-outline');
const NotificationsIcon = makeTabIcon('notifications-outline');
const ProfileIcon = makeTabIcon('person-outline');

export default function KisanLayout() {
  const t = useTranslations('mobile.tabs');
  const unread = useAppSelector((state) => state.notifications.unreadCount);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const screenOptions = useMemo(() => ({
    headerShown: false,
    tabBarActiveTintColor: '#166534',
    tabBarInactiveTintColor: isDark ? '#78716c' : '#a8a29e',
    tabBarStyle: { backgroundColor: isDark ? '#0c0a09' : '#ffffff', borderTopColor: isDark ? '#292524' : '#e7e5e4' },
  }), [isDark]);

  return (
    <RoleGate role="kisan">
      <Tabs screenOptions={screenOptions}>
        <Tabs.Screen name="dashboard" options={{ title: t('dashboard'), tabBarIcon: DashboardIcon }} />
        <Tabs.Screen name="listings/index" options={{ title: t('listings'), tabBarIcon: ListingsIcon }} />
        {/* Route files, not tabs — see marketplace/[id] in (buyer)/_layout.tsx for why these must be hidden. */}
        <Tabs.Screen name="listings/[id]" options={{ href: null }} />
        <Tabs.Screen name="listings/create" options={{ href: null }} />
        <Tabs.Screen name="listings/edit/[id]" options={{ href: null }} />
        <Tabs.Screen name="orders/index" options={{ title: t('orders'), tabBarIcon: OrdersIcon }} />
        <Tabs.Screen name="orders/[id]" options={{ href: null }} />
        <Tabs.Screen name="statements" options={{ title: t('statements'), tabBarIcon: StatementsIcon }} />
        <Tabs.Screen name="notifications" options={{ title: t('inbox'), tabBarIcon: NotificationsIcon, tabBarBadge: unread || undefined }} />
        <Tabs.Screen name="profile" options={{ title: t('profile'), tabBarIcon: ProfileIcon }} />
      </Tabs>
    </RoleGate>
  );
}
