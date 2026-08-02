import { baseApi } from './baseApi';

export interface MandiRate {
  _id: string;
  cropId: string;
  market: string;
  state?: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit?: string;
  date: string;
  source?: string;
}

export const mandiApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Server returns rates for the last 7 days, newest first.
    getMandiRates: builder.query<{ data: MandiRate[] }, string>({
      query: (cropId) => `/mandi-rates/${cropId}`,
      providesTags: (_result, _error, cropId) => [{ type: 'MandiRate', id: cropId }],
    }),
  }),
});

export const { useGetMandiRatesQuery } = mandiApi;
