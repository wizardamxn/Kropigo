import type { PropsWithChildren } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAppSelector } from '@/store/hooks';
import type { MobileRole } from '@/store/authSlice';

export function RoleGate({ role, children }: PropsWithChildren<{ role: Extract<MobileRole, 'kisan' | 'buyer'> }>) {
  const { initialized, user } = useAppSelector((state) => state.auth);
  if (!initialized) return <View className="flex-1 justify-center bg-stone-50 dark:bg-stone-950"><ActivityIndicator color="#166534" /></View>;
  if (!user) return <Redirect href="/welcome" />;
  if (user.role !== role) return <Redirect href={user.role === 'buyer' ? '/(buyer)/dashboard' : '/(kisan)/dashboard'} />;
  return <>{children}</>;
}
