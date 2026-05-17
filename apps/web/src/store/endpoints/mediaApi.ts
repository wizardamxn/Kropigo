import { baseApi } from '../baseApi';

export type CloudinarySignature = {
  timestamp: number;
  signature: string;
};

export type CloudinaryCleanupPayload = {
  mediaUrls: string[];
};

export const mediaApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCloudinarySignature: builder.mutation<CloudinarySignature, void>({
      query: () => ({
        url: '/media/signature',
        method: 'GET',
      }),
    }),
    deleteCloudinaryMedia: builder.mutation<any, CloudinaryCleanupPayload>({
      query: (body) => ({
        url: '/media/cleanup',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useGetCloudinarySignatureMutation, useDeleteCloudinaryMediaMutation } = mediaApi;
