import { baseApi } from './baseApi';

export interface Crop {
  _id: string;
  name: string;
  nameHindi?: string;
  category?: string;
  unit?: string;
}

interface CropsResponse {
  data: Crop[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export const cropsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCrops: builder.query<CropsResponse, { search?: string; category?: string; page?: number; limit?: number } | void>({
      query: (params) => ({ url: '/crops', params: params ?? undefined }),
      providesTags: ['Crop'],
    }),
  }),
});

export const { useGetCropsQuery } = cropsApi;
