import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type MobileRole = 'kisan' | 'buyer' | 'driver' | 'admin';

export interface BankDetails {
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  phone?: string;
  name?: string;
  role: MobileRole;
  username?: string;
  location?: string;
  fathersName?: string;
  marka?: string;
  profilePhoto?: string;
  farmerIdPhoto?: string;
  aadharCardPhoto?: string;
  bankPassbookPhoto?: string;
  bankDetails?: BankDetails;
  isVerified: boolean;
  isActive: boolean;
}

interface AuthState {
  initialized: boolean;
  user: AuthUser | null;
}

const initialState: AuthState = { initialized: false, user: null };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      state.initialized = true;
    },
    updateUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.user) state.user = { ...state.user, ...action.payload };
    },
    clearUser: (state) => {
      state.user = null;
      state.initialized = true;
    },
  },
});

export const { setUser, updateUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
