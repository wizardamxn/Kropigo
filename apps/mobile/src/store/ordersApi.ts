import { baseApi } from './baseApi';
import type { Listing } from './marketplaceApi';

export type OrderStatus =
  | 'sale_confirmed'
  | 'admin_notified'
  | 'qc_scheduled'
  | 'qc_passed'
  | 'qc_failed'
  | 'pickup_scheduled'
  | 'in_transit'
  | 'delivered';

interface OrderParty {
  _id: string;
  name?: string;
  phone?: string;
  profilePhoto?: string;
  /** Only populated by GET /orders/:id, not the list endpoint. */
  location?: string;
  isVerified?: boolean;
}

export interface OrderTimelineEntry {
  status: OrderStatus;
  timestamp: string;
  actorId?: string;
  note?: string;
}

export interface Order {
  _id: string;
  listingId: Listing | string;
  interestId?: string;
  buyerId: OrderParty | string;
  sellerId: OrderParty | string;
  agreedPrice: number;
  quantity: number;
  unit: string;
  totalAmount: number;
  status: OrderStatus;
  timeline: OrderTimelineEntry[];
  billUrl?: string;
  createdAt: string;
}

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<{ data: Order[]; pagination?: { total: number; page: number; pages: number } }, { status?: OrderStatus; page?: number; limit?: number } | void>({
      query: (params) => ({ url: '/orders', params: params ?? undefined }),
      providesTags: (result) => result?.data
        ? [...result.data.map((order) => ({ type: 'Order' as const, id: order._id })), 'Order']
        : ['Order'],
    }),
    getOrder: builder.query<{ data: Order }, string>({
      query: (id) => `/orders/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Order', id }],
    }),
  }),
});

export const { useGetOrdersQuery, useGetOrderQuery } = ordersApi;
