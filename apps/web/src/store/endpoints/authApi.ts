import { baseApi } from '../baseApi';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<
      { data: { accessToken: string; user: any }; message: string },
      { name: string; email: string; phone: string; password: string; role: string }
    >({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
    }),
    login: builder.mutation<
      { data: { accessToken: string; user: any }; message: string },
      { email: string; password: string }
    >({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
    }),
    /*
    sendOtp: builder.mutation<{ message: string }, { phone: string }>({
      query: (body) => ({
        url: '/auth/send-otp',
        method: 'POST',
        body,
      }),
    }),
    verifyOtp: builder.mutation<
      { accessToken: string; user: any },
      { phone: string; otp: string }
    >({
      query: (body) => ({
        url: '/auth/verify-otp',
        method: 'POST',
        body,
      }),
    }),
    */
    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
    updateProfile: builder.mutation<
      { data: any; message: string },
      { name: string; role: string; location?: string; profilePhoto?: string }
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
  // useSendOtpMutation,
  // useVerifyOtpMutation,
  useLogoutMutation,
  useUpdateProfileMutation,
} = authApi;
