import { baseApi } from '../baseApi'

export interface INotification {
  _id: string
  type: string
  message: string
  payload: any
  isRead: boolean
  targetRole: string
  orderId: string | null
  createdAt: string
}

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<{
      data: INotification[]
      pagination: { total: number; page: number; pages: number }
    }, { page?: number; unreadOnly?: boolean; limit?: number }>({
      query: ({ page = 1, unreadOnly = false, limit = 20 } = {}) => ({
        url: `/notifications?page=${page}&unreadOnly=${unreadOnly}&limit=${limit}`,
        method: 'GET'
      }),
      providesTags: ['Notifications']
    }),

    getUnreadCount: builder.query<{ count: number }, void>({
      query: () => '/notifications/unread-count',
      providesTags: ['NotificationCount']
    }),

    markNotificationRead: builder.mutation<void, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH'
      }),
      invalidatesTags: ['Notifications', 'NotificationCount']
    }),

    markAllRead: builder.mutation<void, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PATCH'
      }),
      invalidatesTags: ['Notifications', 'NotificationCount']
    })
  })
})

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllReadMutation
} = notificationApi
