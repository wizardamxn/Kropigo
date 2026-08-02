import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/store/notificationApi';
import { useTranslations } from 'use-intl';
import { markAllRead, markOneRead, setNotifications, setUnreadCount, type AppNotification } from '@/store/notificationSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { EmptyState, ErrorState, ListGap, Loading, Screen } from '@/components/ui';

const PAGE_SIZE = 20;

/** Maps a notification to the screen it should open when tapped. */
const routeFor = (notification: AppNotification, role?: string) => {
  const payload = notification.payload as { orderId?: string; listingId?: string };
  switch (notification.type) {
    case 'new_offer_received':
    case 'interest_withdrawn':
      return payload.listingId ? { pathname: '/(kisan)/listings/[id]' as const, params: { id: payload.listingId } } : null;
    case 'offer_rejected':
      return payload.listingId ? { pathname: '/(buyer)/marketplace/[id]' as const, params: { id: payload.listingId } } : null;
    case 'offer_accepted':
    case 'order_status_updated':
      if (!payload.orderId) return null;
      return role === 'buyer'
        ? { pathname: '/(buyer)/orders/[id]' as const, params: { id: payload.orderId } }
        : { pathname: '/(kisan)/orders/[id]' as const, params: { id: payload.orderId } };
    case 'statement_updated':
      return { pathname: '/(kisan)/statements' as const, params: {} };
    default:
      return null;
  }
};

export function NotificationsScreen({ showBack = false }: { showBack?: boolean }) {
  const t = useTranslations('mobile.notifications');
  const tActions = useTranslations('mobile.actions');
  const tErrors = useTranslations('mobile.errors');
  const dispatch = useAppDispatch();
  const role = useAppSelector((state) => state.auth.user?.role);
  const items = useAppSelector((state) => state.notifications.items);
  const unreadCount = useAppSelector((state) => state.notifications.unreadCount);

  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, isError, refetch } = useGetNotificationsQuery({ page: 1, limit: page * PAGE_SIZE });
  const { data: unread } = useGetUnreadCountQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllServer] = useMarkAllNotificationsReadMutation();

  useEffect(() => {
    if (!data?.data) return;
    dispatch(setNotifications(data.data.map((item) => ({
      id: item._id,
      type: item.type,
      message: item.message,
      payload: item.payload,
      isRead: item.isRead,
      timestamp: item.createdAt,
    }))));
  }, [data, dispatch]);

  useEffect(() => { if (unread) dispatch(setUnreadCount(unread.count)); }, [dispatch, unread]);

  const hasMore = data ? page < data.pagination.pages : false;

  const open = async (notification: AppNotification) => {
    if (!notification.isRead) {
      dispatch(markOneRead(notification.id));
      await markRead(notification.id).unwrap().catch(() => refetch());
    }
    const target = routeFor(notification, role);
    if (target) router.push(target);
  };

  const markEverythingRead = async () => {
    dispatch(markAllRead());
    await markAllServer().unwrap().catch(() => refetch());
  };

  return (
    <Screen edges={showBack ? ['top'] : ['top']}>
      <View className="h-[62px] flex-row items-center justify-between border-b border-stone-200 px-[18px] dark:border-stone-800">
        {showBack ? (
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text className="font-bold text-primary">‹ {tActions('back')}</Text>
          </Pressable>
        ) : (
          <Text className="text-3xl font-extrabold text-stone-900 dark:text-stone-50">{t('title')}</Text>
        )}
        {showBack ? <Text className="text-[19px] font-extrabold text-stone-900 dark:text-stone-50">{t('title')}</Text> : null}
        {unreadCount > 0 ? (
          <Pressable onPress={markEverythingRead} hitSlop={8}>
            <Text className="font-bold text-primary">{tActions('readAll')}</Text>
          </Pressable>
        ) : (
          <View className="w-[46px]" />
        )}
      </View>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState message={tErrors('loadNotifications')} onRetry={refetch} />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 14 }}
          ItemSeparatorComponent={ListGap}
          refreshControl={<RefreshControl refreshing={isFetching && page === 1} onRefresh={refetch} tintColor="#166534" />}
          onEndReachedThreshold={0.4}
          onEndReached={() => { if (hasMore && !isFetching) setPage((prev) => prev + 1); }}
          ListEmptyComponent={
            <EmptyState icon="notifications-outline" title={t('empty')} subtitle={t('emptyHint')} />
          }
          ListFooterComponent={hasMore ? <ActivityIndicator color="#166534" style={{ marginVertical: 16 }} /> : null}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => open(item)}
              className={`flex-row rounded-2xl border p-[15px] active:opacity-80 ${
                item.isRead
                  ? 'border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900'
                  : 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950'
              }`}
            >
              <View className="w-5 pt-[5px]">
                {!item.isRead ? <View className="h-2 w-2 rounded-full bg-primary" /> : null}
              </View>
              <View className="flex-1">
                <Text className="leading-[21px] text-stone-800 dark:text-stone-200">{item.message}</Text>
                <Text className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">
                  {new Date(item.timestamp).toLocaleString()}
                </Text>
              </View>
              {routeFor(item, role) ? (
                <Ionicons name="chevron-forward" size={16} color="#a8a29e" style={{ alignSelf: 'center' }} />
              ) : null}
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}
