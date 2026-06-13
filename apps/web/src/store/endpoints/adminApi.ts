import { baseApi } from '../baseApi';

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getKisans: builder.query<any, Record<string, any>>({
      query: (params) => ({ url: '/admin/kisans', params }),
      providesTags: ['AdminKisan'],
    }),
    setKisanVerification: builder.mutation<any, { id: string; isVerified: boolean }>({
      query: ({ id, isVerified }) => ({
        url: `/admin/kisans/${id}/verify`,
        method: 'PATCH',
        body: { isVerified },
      }),
      invalidatesTags: ['AdminKisan'],
    }),
  }),
});

export const { useGetKisansQuery, useSetKisanVerificationMutation } = adminApi;
