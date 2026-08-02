import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { clearToken, getToken } from '@/lib/secureToken';
import { clearUser } from './authSlice';

export const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:5000/api/v1';
const rawBaseQuery = fetchBaseQuery({
  baseUrl: apiUrl,
  prepareHeaders: (headers) => {
    const token = getToken();
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

const baseQuery: typeof rawBaseQuery = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    void clearToken();
    api.dispatch(clearUser());
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery,
  tagTypes: ['User', 'Notifications', 'NotificationCount', 'Listing', 'Interest', 'Order', 'Statement', 'Crop', 'MandiRate'],
  endpoints: () => ({}),
});
