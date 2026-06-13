import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_URL } from '@/lib/config';

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    credentials: 'include', // sends the httpOnly cookie automatically on every request
  }),
  tagTypes: ['User', 'Listing', 'Crop', 'MandiRate', 'Interest', 'Order', 'Notifications', 'NotificationCount', 'AdminKisan'],
  endpoints: () => ({}),
});
