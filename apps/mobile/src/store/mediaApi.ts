import { baseApi } from './baseApi';

export interface CloudinarySignature {
  timestamp: number;
  signature: string;
}

export const mediaApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // A signature is only valid for ~1h and is consumed per upload, so this is a
    // mutation (never cached) — one fresh call per file.
    getCloudinarySignature: builder.mutation<CloudinarySignature, void>({
      query: () => ({ url: '/media/signature', method: 'GET' }),
    }),
    deleteCloudinaryMedia: builder.mutation<void, { mediaUrls: string[] }>({
      query: (body) => ({ url: '/media/cleanup', method: 'POST', body }),
    }),
  }),
});

export const { useGetCloudinarySignatureMutation, useDeleteCloudinaryMediaMutation } = mediaApi;
