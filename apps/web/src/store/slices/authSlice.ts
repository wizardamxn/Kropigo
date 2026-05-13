import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserRole } from '@kropi/schemas/enum';

export interface AuthUser {
  id: string;
  email: string;
  phone?: string;
  name?: string;
  role: UserRole;
  location?: string;
  profilePhoto?: string;
  isVerified: boolean;
  isActive: boolean;
}

export interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  user: AuthUser | null; 
}

const initialState: AuthState = {
  accessToken: null,
  isAuthenticated: false,
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ accessToken: string; user: AuthUser }>
    ) => {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.accessToken = null;
      state.isAuthenticated = false;
      state.user = null;
    },
    updateUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    }
  },
});

export const { setCredentials, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
