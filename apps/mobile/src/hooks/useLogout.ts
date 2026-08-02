import { useCallback } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { clearToken } from '@/lib/secureToken';
import { clearUser } from '@/store/authSlice';
import { baseApi } from '@/store/baseApi';
import { useAppDispatch } from '@/store/hooks';

/** Clears the stored JWT, wipes every cached query, and returns to the welcome screen. */
export function useLogout() {
  const dispatch = useAppDispatch();

  return useCallback(() => {
    Alert.alert('Sign out?', "You'll need to sign in again to see your account.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await clearToken();
          dispatch(clearUser());
          // Otherwise the next account to sign in briefly sees this one's data.
          dispatch(baseApi.util.resetApiState());
          router.replace('/welcome');
        },
      },
    ]);
  }, [dispatch]);
}
