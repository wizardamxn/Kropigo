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
  isAuthenticated: boolean;
  isInitialized: boolean;
  user: AuthUser | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isInitialized: false,
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isInitialized = true;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isInitialized = true;  // 401 / logout → we now know the answer
    },
    updateUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { setUser, clearUser, updateUser } = authSlice.actions;
export default authSlice.reducer;