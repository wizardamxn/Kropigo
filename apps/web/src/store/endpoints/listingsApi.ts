import { baseApi } from '../baseApi';

export type ListingPayload = {
  cropId?: string;
  variety?: string;
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

export type SubmitInterestPayload = {
  price: number;
  quantity?: number;
  notes?: string;
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
    getListingInterests: builder.query<any, string>({
      query: (listingId) => `/listings/${listingId}/interests`,
      providesTags: (result, error, listingId) => [{ type: 'Listing', id: `interests-${listingId}` }],
    }),
    acceptInterest: builder.mutation<{ success: boolean; message: string; orderId?: string }, { listingId: string; interestId: string }>({
      query: ({ listingId, interestId }) => ({
        url: `/listings/${listingId}/interests/${interestId}/accept`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, { listingId }) => [
        { type: 'Listing', id: listingId },
        { type: 'Listing', id: `interests-${listingId}` },
        'Listing',
      ],
    }),
    rejectInterest: builder.mutation<any, { listingId: string; interestId: string }>({
      query: ({ listingId, interestId }) => ({
        url: `/listings/${listingId}/interests/${interestId}/reject`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, { listingId }) => [
        { type: 'Listing', id: listingId },
        { type: 'Listing', id: `interests-${listingId}` },
        'Listing',
      ],
    }),
    // Buyer: submit an interest on a listing
    submitInterest: builder.mutation<any, { listingId: string; body: SubmitInterestPayload }>({
      query: ({ listingId, body }) => ({
        url: `/listings/${listingId}/interests`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { listingId }) => [
        { type: 'Interest', id: `mine-${listingId}` },
        'Interest',
        { type: 'Listing', id: listingId },
      ],
    }),
    // Buyer: get their own interest for a specific listing
    getMyInterestForListing: builder.query<any, string>({
      query: (listingId) => `/listings/${listingId}/interests/mine`,
      providesTags: (result, error, listingId) => [{ type: 'Interest', id: `mine-${listingId}` }],
    }),
  }),
});

export const {
  useGetListingsQuery,
  useGetListingByIdQuery,
  useCreateListingMutation,
  useUpdateListingMutation,
  useDeleteListingMutation,
  useGetListingInterestsQuery,
  useAcceptInterestMutation,
  useRejectInterestMutation,
  useSubmitInterestMutation,
  useGetMyInterestForListingQuery,
} = listingsApi;
