import { baseApi } from '../baseApi';

export const mandiApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMandiRates: builder.query<any, string>({
      query: (cropId) => `/mandi-rates/${cropId}`,
    }),
    createManualMandiRate: builder.mutation<any, any>({
      query: (data) => ({
        url: '/mandi-rates',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useGetMandiRatesQuery,
  useCreateManualMandiRateMutation,
} = mandiApi;
