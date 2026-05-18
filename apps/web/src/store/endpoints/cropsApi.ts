import { baseApi } from '../baseApi';

export interface GetCropsParams {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const cropsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCrops: builder.query<any, GetCropsParams | void>({
      query: (params) => {
        if (!params) return '/crops';
        const queryParams = new URLSearchParams();
        if (params.category) queryParams.append('category', params.category);
        if (params.search) queryParams.append('search', params.search);
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        const qs = queryParams.toString();
        return qs ? `/crops?${qs}` : '/crops';
      },
      providesTags: ['Crop'],
    }),
  }),
});

export const {
  useGetCropsQuery,
} = cropsApi;
