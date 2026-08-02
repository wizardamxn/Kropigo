import { baseApi } from './baseApi';

export type ListingStatus = 'draft' | 'open' | 'interest_received' | 'sale_confirmed' | 'cancelled' | 'expired' | 'closed';

export interface Listing {
  _id: string;
  cropId: { _id: string; name: string; category?: string } | string;
  sellerId: { _id: string; name?: string; phone?: string; location?: string; isVerified?: boolean; averageRating?: number } | string;
  quantity: number;
  variety?: string;
  grade: string;
  unit: string;
  description?: string;
  mediaUrls?: string[];
  status: ListingStatus;
  farmAddress: string;
  farmState: string;
  farmDistrict: string;
  /** Only set once the seller pinned the farm; the map view filters on it. */
  farmCoordinates?: { lat: number; lng: number };
  expiresAt?: string;
  viewCount?: number;
  interestedBuyerCount?: number;
  interestCount?: number;
  hasUnreadInterests?: boolean;
  createdAt: string;
}

export interface CreateListingPayload {
  cropId: string;
  quantity: number;
  variety?: string;
  grade: 'A' | 'B';
  unit: 'kg' | 'quintal' | 'ton';
  description?: string;
  mediaUrls?: string[];
  farmAddress?: string;
  farmState?: string;
  farmDistrict?: string;
  lat?: number;
  lng?: number;
}

export interface UpdateListingPayload {
  quantity?: number;
  variety?: string;
  grade?: 'A' | 'B';
  unit?: 'kg' | 'quintal' | 'ton';
  description?: string;
  farmAddress?: string;
  farmState?: string;
  farmDistrict?: string;
  status?: 'draft' | 'open';
  /** Both must be sent together for the server to move the pin. */
  lat?: number;
  lng?: number;
  /** New uploads only — the server appends these to whatever survives deletedMediaUrls. */
  mediaUrls?: string[];
  deletedMediaUrls?: string[];
}

export interface Interest {
  _id: string;
  listingId: Listing | string;
  buyerId?: { _id: string; name?: string; phone?: string; location?: string; isVerified?: boolean; averageRating?: number } | string;
  price: number;
  quantity?: number;
  notes?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  orderId?: string;
  createdAt: string;
  updatedAt: string;
}

export const marketplaceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getListings: builder.query<{ data: Listing[]; meta?: { page: number; totalPages: number } }, { page?: number; limit?: number; state?: string; district?: string; sellerId?: string; status?: ListingStatus } | void>({
      query: (params) => ({ url: '/listings', params: params ?? undefined }),
      providesTags: (result) => result?.data
        ? [...result.data.map((listing) => ({ type: 'Listing' as const, id: listing._id })), 'Listing']
        : ['Listing'],
    }),
    // Marketplace map view — slim, unpaginated, geocoded listings only (max 200).
    getListingsForMap: builder.query<{ data: Listing[] }, { state?: string; district?: string; cropId?: string } | void>({
      query: (params) => ({ url: '/listings', params: { ...(params ?? {}), forMap: 'true' } }),
      providesTags: ['Listing'],
    }),
    getListing: builder.query<{ data: Listing }, string>({
      query: (id) => `/listings/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Listing', id }],
    }),
    createListing: builder.mutation<{ data: Listing; mandiRateReference: unknown; message: string }, CreateListingPayload>({
      query: (body) => ({ url: '/listings', method: 'POST', body }),
      invalidatesTags: ['Listing'],
    }),
    updateListing: builder.mutation<{ data: Listing }, { id: string; body: UpdateListingPayload }>({
      query: ({ id, body }) => ({
        url: `/listings/${id}`,
        method: 'PUT',
        // The server destructures both arrays unconditionally, so always send them.
        body: { ...body, mediaUrls: body.mediaUrls ?? [], deletedMediaUrls: body.deletedMediaUrls ?? [] },
      }),
      invalidatesTags: (_result, _error, arg) => [{ type: 'Listing', id: arg.id }, 'Listing'],
    }),
    deleteListing: builder.mutation<void, string>({
      query: (id) => ({ url: `/listings/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Listing', id }, 'Listing'],
    }),
    getMyInterestForListing: builder.query<{ data: Interest | null }, string>({
      query: (listingId) => `/listings/${listingId}/interests/mine`,
      providesTags: (_result, _error, id) => [{ type: 'Interest', id }],
    }),
    submitInterest: builder.mutation<{ data: Interest }, { listingId: string; price: number; quantity?: number; notes?: string }>({
      query: ({ listingId, ...body }) => ({ url: `/listings/${listingId}/interests`, method: 'POST', body }),
      invalidatesTags: (_result, _error, arg) => [{ type: 'Interest', id: arg.listingId }, 'Interest', { type: 'Listing', id: arg.listingId }, 'Listing'],
    }),
    withdrawInterest: builder.mutation<void, { listingId: string; interestId: string }>({
      query: ({ listingId, interestId }) => ({ url: `/listings/${listingId}/interests/${interestId}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, arg) => [{ type: 'Interest', id: arg.listingId }, 'Interest', { type: 'Listing', id: arg.listingId }, 'Listing'],
    }),
    getMyInterests: builder.query<{ data: Interest[] }, { status?: Interest['status'] } | void>({
      query: (params) => ({ url: '/interests/my', params: params ?? undefined }),
      providesTags: ['Interest'],
    }),
    // Kisan: interests received on one of their own listings
    getListingInterests: builder.query<{ data: Interest[] }, string>({
      query: (listingId) => `/listings/${listingId}/interests`,
      providesTags: (_result, _error, listingId) => [{ type: 'Interest', id: listingId }, 'Interest'],
    }),
    acceptInterest: builder.mutation<{ orderId: string; totalAmount: number; agreedPrice: number; quantity: number }, { listingId: string; interestId: string }>({
      query: ({ listingId, interestId }) => ({ url: `/listings/${listingId}/interests/${interestId}/accept`, method: 'PATCH' }),
      invalidatesTags: (_result, _error, arg) => [{ type: 'Interest', id: arg.listingId }, 'Interest', { type: 'Listing', id: arg.listingId }, 'Listing', 'Order'],
    }),
    rejectInterest: builder.mutation<void, { listingId: string; interestId: string }>({
      query: ({ listingId, interestId }) => ({ url: `/listings/${listingId}/interests/${interestId}/reject`, method: 'PATCH' }),
      invalidatesTags: (_result, _error, arg) => [{ type: 'Interest', id: arg.listingId }, 'Interest', { type: 'Listing', id: arg.listingId }, 'Listing'],
    }),
  }),
});

export const {
  useGetListingsQuery,
  useGetListingsForMapQuery,
  useGetListingQuery,
  useCreateListingMutation,
  useUpdateListingMutation,
  useDeleteListingMutation,
  useGetMyInterestForListingQuery,
  useSubmitInterestMutation,
  useWithdrawInterestMutation,
  useGetMyInterestsQuery,
  useGetListingInterestsQuery,
  useAcceptInterestMutation,
  useRejectInterestMutation,
} = marketplaceApi;
