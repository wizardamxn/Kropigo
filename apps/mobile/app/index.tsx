import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { hydrateToken } from '@/lib/secureToken';
import { authApi } from '@/store/authApi';
import { clearUser, setUser } from '@/store/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export default function Bootstrap() {
  const dispatch = useAppDispatch();
  const { initialized, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    let active = true;
    (async () => {
      const token = await hydrateToken();
      if (!token) {
        if (active) dispatch(clearUser());
        return;
      }
      try {
        const response = await dispatch(authApi.endpoints.getMe.initiate()).unwrap();
        if (active) dispatch(setUser(response.data.user));
      } catch {
        if (active) dispatch(clearUser());
      }
    })();
    return () => { active = false; };
  }, [dispatch]);

  if (!initialized) {
    return <View className="flex-1 items-center justify-center bg-stone-50 dark:bg-stone-950"><ActivityIndicator color="#166534" /></View>;
  }
  if (!user) return <Redirect href="/welcome" />;
  return <Redirect href={user.role === 'buyer' ? '/(buyer)/dashboard' : '/(kisan)/dashboard'} />;
}
