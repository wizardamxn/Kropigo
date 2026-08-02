import { baseApi } from '../baseApi';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    sendOtp: builder.mutation<
      { data: null; message: string },
      { phone: string; email: string }
    >({
      query: (body) => ({
        url: '/otp/send',
        method: 'POST',
        body,
      }),
    }),
    verifyOtp: builder.mutation<
      { data: { verificationToken: string }; message: string },
      { phone: string; otp: string }
    >({
      query: (body) => ({
        url: '/otp/verify',
        method: 'POST',
        body,
      }),
    }),
    register: builder.mutation<
      { data: { user: any }; message: string },
      { name: string; email: string; phone: string; password: string; role: string; verificationToken: string }
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
        fathersName?: string;
        marka?: string;
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
  useSendOtpMutation,
  useVerifyOtpMutation,
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useUpdateProfileMutation,
} = authApi;
