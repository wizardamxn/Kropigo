import { baseApi } from '../baseApi';
import type { OrderStatus } from '@kropi/schemas/enum';

export interface IOrder {
  _id: string
  listingId: any
  interestId: any
  buyerId: any
  sellerId: any
  agreedPrice: number
  quantity: number
  unit: string
  totalAmount: number
  status: OrderStatus
  timeline: Array<{
    status: OrderStatus
    timestamp: string
    actorId: string
    note: string | null
  }>
  billUrl: string | null
  createdAt: string
  updatedAt: string
}

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<{
      data: IOrder[]
      pagination: { total: number; page: number; pages: number }
    }, { page?: number; limit?: number; status?: string }>({
      query: ({ page = 1, limit = 10, status } = {}) => {
        let url = `/orders?page=${page}&limit=${limit}`
        if (status) url += `&status=${status}`
        return { url, method: 'GET' }
      },
      providesTags: ['Order']
    }),

    getOrderById: builder.query<{ data: IOrder }, string>({
      query: (id) => `/orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'Order', id }]
    }),

    updateOrderStatus: builder.mutation<
      { success: boolean; message: string; data: IOrder },
      { orderId: string; status: string; note?: string }
    >({
      query: ({ orderId, status, note }) => ({
        url: `/orders/${orderId}/status`,
        method: 'PATCH',
        body: { status, note }
      }),
      // Invalidate this specific order and the list so both refetch after update
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'Order', id: orderId },
        'Order'
      ]
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useUpdateOrderStatusMutation,
} = ordersApi;

