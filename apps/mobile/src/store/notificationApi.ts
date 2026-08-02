import { baseApi } from './baseApi';

export interface ServerNotification {
  _id: string;
  type: string;
  message: string;
  payload: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<
      { data: ServerNotification[]; pagination: { total: number; page: number; pages: number } },
      { page?: number; limit?: number } | void
    >({
      query: (params) => ({ url: '/notifications', params: params ?? { page: 1, limit: 20 } }),
      providesTags: ['Notifications'],
    }),
    getUnreadCount: builder.query<{ count: number }, void>({
      query: () => '/notifications/unread-count',
      providesTags: ['NotificationCount'],
    }),
    markNotificationRead: builder.mutation<void, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Notifications', 'NotificationCount'],
    }),
    markAllNotificationsRead: builder.mutation<void, void>({
      query: () => ({ url: '/notifications/read-all', method: 'PATCH' }),
      invalidatesTags: ['Notifications', 'NotificationCount'],
    }),
  }),
});

export const { useGetNotificationsQuery, useGetUnreadCountQuery, useMarkNotificationReadMutation, useMarkAllNotificationsReadMutation } = notificationApi;
