import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { clearToken } from '@/lib/secureToken';
import { clearUser } from '@/store/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export function PlaceholderScreen({ title, message, profile = false }: { title: string; message: string; profile?: boolean }) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const logout = async () => {
    await clearToken();
    dispatch(clearUser());
    router.replace('/welcome');
  };

  return (
    <SafeAreaView className="flex-1 bg-stone-50 dark:bg-stone-950">
      <View className="p-6">
        <Text className="text-2xl font-extrabold text-stone-900 dark:text-stone-50">{title}</Text>
        {profile && <Text className="mt-3 text-lg font-bold text-primary">{user?.name ?? user?.email}</Text>}
        <Text className="mt-3 text-base leading-6 text-stone-500 dark:text-stone-400">{message}</Text>
        {profile && (
          <Pressable className="mt-7 items-center rounded-xl bg-primary p-3.5 active:opacity-90" onPress={logout}>
            <Text className="font-bold text-white">Sign out</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
