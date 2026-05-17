import { baseApi } from '../baseApi';

export type ListingPayload = {
  cropId?: string;
  quantity: string;
  unit: string;
  askingPrice: string;
  description?: string;
  farmAddress: string;
  farmState: string;
  farmDistrict: string;
  lat?: string;
  lng?: string;
  mediaUrls?: string[];
  deletedMediaUrls?: string[];
  status?: string;
};

export const listingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getListings: builder.query<any, Record<string, any>>({
      query: (params) => ({
        url: '/listings',
        params,
      }),
      providesTags: ['Listing'],
    }),
    getListingById: builder.query<any, string>({
      query: (id) => `/listings/${id}`,
      providesTags: (result, error, id) => [{ type: 'Listing', id }],
    }),
    createListing: builder.mutation<any, ListingPayload>({
      query: (body) => ({
        url: '/listings',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Listing'],
    }),
    updateListing: builder.mutation<any, { id: string; body: ListingPayload }>({
      query: ({ id, body }) => ({
        url: `/listings/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Listing', id }, 'Listing'],
    }),
    deleteListing: builder.mutation<any, string>({
      query: (id) => ({
        url: `/listings/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Listing'],
    }),
  }),
});

export const {
  useGetListingsQuery,
  useGetListingByIdQuery,
  useCreateListingMutation,
  useUpdateListingMutation,
  useDeleteListingMutation,
} = listingsApi;
