import { baseApi } from './baseApi';

export interface StatementEntry {
  orderId: string;
  listingId?: string;
  cropName: string;
  grade?: string;
  quantity: number;
  unit: string;
  agreedPrice: number;
  totalAmount: number;
  buyerName?: string;
  soldAt: string;
}

export interface DailyStatement {
  _id: string;
  dateKey: string;
  entries: StatementEntry[];
  totalSales: number;
  totalQuantity: number;
  totalAmount: number;
}

export interface StatementCropSummary {
  cropName: string;
  grade?: string;
  unit: string;
  quantity: number;
  amount: number;
  sales: number;
  firstSale: string;
  lastSale: string;
}

export const statementsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStatements: builder.query<{ data: DailyStatement[]; summary: { lifetimeSales: number; lifetimeAmount: number }; meta?: { page: number; totalPages: number } }, { page?: number; limit?: number } | void>({
      query: (params) => ({ url: '/statements', params: params ?? undefined }),
      providesTags: ['Statement'],
    }),
    getStatementsSummary: builder.query<{ data: { crops: StatementCropSummary[]; totals: { sales: number; amount: number }; periodStart: string; periodEnd: string } }, void>({
      query: () => '/statements/summary',
      providesTags: ['Statement'],
    }),
  }),
});

export const { useGetStatementsQuery, useGetStatementsSummaryQuery } = statementsApi;
