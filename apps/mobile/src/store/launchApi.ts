import { baseApi } from './baseApi';

export const launchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLaunchStatus: builder.query<{ data: { isLaunched: boolean } }, void>({
      query: () => '/launch-status',
    }),
  }),
});

export const { useGetLaunchStatusQuery } = launchApi;
