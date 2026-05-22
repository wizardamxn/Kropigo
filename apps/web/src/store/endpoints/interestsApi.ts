import { baseApi } from '../baseApi';

export type GetMyInterestsParams = {
  status?: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  page?: number;
  limit?: number;
};

export const interestsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyInterests: builder.query<any, GetMyInterestsParams | void>({
      query: (params) => {
        if (!params) return '/interests/my';
        const qs = new URLSearchParams();
        if (params.status) qs.append('status', params.status);
        if (params.page) qs.append('page', String(params.page));
        if (params.limit) qs.append('limit', String(params.limit));
        const str = qs.toString();
        return str ? `/interests/my?${str}` : '/interests/my';
      },
      providesTags: ['Interest'],
    }),
  }),
});

export const { useGetMyInterestsQuery } = interestsApi;
