import { baseApi } from '../baseApi';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<
      { data: { user: any }; message: string },
      { name: string; email: string; phone: string; password: string; role: string }
    >({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
    }),
    login: builder.mutation<
      { data: { user: any }; message: string },
      { email: string; password: string }
    >({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
    }),
    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
    getMe: builder.query<{ data: { user: any }; message: string }, void>({
      query: () => '/auth/me',
    }),
    updateProfile: builder.mutation<
      { data: any; message: string },
      { 
        name: string; 
        role: string; 
        location?: string; 
        profilePhoto?: string;
        farmerIdPhoto?: string;
        aadharCardPhoto?: string;
        bankPassbookPhoto?: string;
        bankDetails?: {
          accountNumber: string;
          ifscCode: string;
          bankName: string;
        };
      }
    >({
      query: (body) => ({
        url: '/user/profile',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useUpdateProfileMutation,
} = authApi;
