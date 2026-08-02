import { baseApi } from './baseApi';
import type { AuthUser, BankDetails, MobileRole } from './authSlice';

export interface AuthResponse { data: { user: AuthUser; token?: string }; message: string }

/**
 * Mirrors the server's profileSchema. Photo fields accept '' to clear them —
 * omitting a key leaves the stored value untouched.
 */
export interface UpdateProfilePayload {
  name: string;
  role: MobileRole;
  location?: string;
  fathersName?: string;
  marka?: string;
  profilePhoto?: string;
  farmerIdPhoto?: string;
  aadharCardPhoto?: string;
  bankPassbookPhoto?: string;
  bankDetails?: BankDetails;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    sendOtp: builder.mutation<{ data: null; message: string }, { phone: string; email: string }>({
      query: (body) => ({ url: '/otp/send', method: 'POST', body }),
    }),
    verifyOtp: builder.mutation<{ data: { verificationToken: string }; message: string }, { phone: string; otp: string }>({
      query: (body) => ({ url: '/otp/verify', method: 'POST', body }),
    }),
    register: builder.mutation<AuthResponse, { name: string; email: string; phone: string; password: string; role: 'kisan' | 'buyer'; verificationToken: string }>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    getMe: builder.query<{ data: { user: AuthUser }; message: string }, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation<{ data: AuthUser; message: string }, UpdateProfilePayload>({
      query: (body) => ({ url: '/user/profile', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const { useLoginMutation, useSendOtpMutation, useVerifyOtpMutation, useRegisterMutation, useGetMeQuery, useUpdateProfileMutation } = authApi;
