import { baseApi } from '../baseApi';

export const cropsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCrops: builder.query<any, void>({
      query: () => '/crops',
      providesTags: ['Crop'],
    }),
  }),
});

export const {
  useGetCropsQuery,
} = cropsApi;
