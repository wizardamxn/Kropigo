import { baseApi } from '../baseApi';

export type StatementEntry = {
  orderId: string;
  cropName: string;
  grade?: string;
  quantity: number;
  unit: string;
  agreedPrice: number;
  totalAmount: number;
  buyerName?: string;
  soldAt: string;
};

export type DailyStatement = {
  _id: string;
  sellerId: string;
  dateKey: string;
  date: string;
  entries: StatementEntry[];
  totalSales: number;
  totalQuantity: number;
  totalAmount: number;
};

export type CropStatementRow = {
  cropName: string;
  grade: string | null;
  unit: string;
  quantity: number;
  amount: number;
  sales: number;
  firstSale: string;
  lastSale: string;
};

export type StatementSummary = {
  crops: CropStatementRow[];
  totals: { sales: number; amount: number };
  periodStart: string | null;
  periodEnd: string | null;
};

export const statementsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStatementSummary: builder.query<{ data: StatementSummary }, { sellerId?: string } | void>({
      query: (params) => ({
        url: '/statements/summary',
        params: params || {},
      }),
      providesTags: ['Statement'],
    }),
    getMyStatements: builder.query<
      {
        data: DailyStatement[];
        summary: { lifetimeSales: number; lifetimeAmount: number };
        meta: { total: number; page: number; limit: number; totalPages: number };
      },
      { page?: number; limit?: number; sellerId?: string } | void
    >({
      query: (params) => ({
        url: '/statements',
        params: params || {},
      }),
      providesTags: ['Statement'],
    }),
  }),
});

export const { useGetMyStatementsQuery, useGetStatementSummaryQuery } = statementsApi;
