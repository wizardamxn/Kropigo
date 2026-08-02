import { useRef, type PropsWithChildren } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslations } from 'use-intl';
import { useGetLaunchStatusQuery } from '@/store/launchApi';

/**
 * Blocks the app while the platform is pre-launch. Polls every 15s so the gate
 * lifts on its own when the team goes live. A network failure is treated as
 * "launched" — an unreachable API shouldn't lock people out of a released app.
 */
export function LaunchGate({ children }: Readonly<PropsWithChildren>) {
  const t = useTranslations('mobile.launch');
  const { data, isLoading, isError } = useGetLaunchStatusQuery(undefined, {
    pollingInterval: 15000,
    refetchOnReconnect: true,
  });

  // Once open, the gate stays open. Falling back to the spinner would unmount
  // the whole navigator tree and leave any in-flight navigation with nothing to
  // dispatch to — sign-out does exactly that, calling `resetApiState()` (which
  // returns this query to its loading state) and then navigating immediately.
  // Latch on a definitive answer only: `data` is undefined while the first
  // request is in flight, so a `!== false` test here would open the gate for
  // pre-launch users before the API has replied.
  const launched = useRef(false);
  launched.current ||= isError || data?.data.isLaunched === true;

  if (isLoading && !launched.current) {
    return (
      <View className="flex-1 items-center justify-center bg-stone-950">
        <ActivityIndicator color="#4ade80" />
      </View>
    );
  }

  if (isError || data?.data.isLaunched !== false) return <>{children}</>;

  return (
    <View className="flex-1 items-center justify-center bg-stone-950 px-9">
      <View className="h-16 w-16 items-center justify-center rounded-2xl bg-green-900">
        <Ionicons name="leaf-outline" size={30} color="#4ade80" />
      </View>
      <Text className="mt-6 font-script text-5xl text-green-400">KropiGo</Text>
      <Text className="mt-4 text-center text-2xl font-extrabold leading-8 text-stone-50">{t('title')}</Text>
      <Text className="mt-3 text-center text-base leading-6 text-stone-400">{t('body')}</Text>
      <ActivityIndicator color="#4ade80" style={{ marginTop: 28 }} />
    </View>
  );
}
