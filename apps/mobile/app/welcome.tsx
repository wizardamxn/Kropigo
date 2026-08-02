import { Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslations } from 'use-intl';

export default function Welcome() {
  const t = useTranslations('mobile.welcome');
  return (
    <SafeAreaView className="flex-1 bg-stone-50 dark:bg-stone-950">
      <View className="flex-1 justify-center p-7">
        <Text className="font-script text-5xl text-primary">KropiGo</Text>
        <Text className="mt-5 font-serif text-4xl leading-[46px] text-stone-900 dark:text-stone-50">
          {t('tagline')}
        </Text>
        <Text className="mb-10 mt-3.5 text-lg leading-6 text-stone-500 dark:text-stone-400">
          {t('subtitle')}
        </Text>
        <Link href="/register" asChild>
          <Pressable className="h-[52px] items-center justify-center rounded-xl bg-primary active:opacity-90">
            <Text className="text-base font-extrabold text-white">{t('createAccount')}</Text>
          </Pressable>
        </Link>
        <Link href="/login" asChild>
          <Pressable className="mt-3 h-[52px] items-center justify-center rounded-xl border border-primary active:opacity-70">
            <Text className="text-base font-extrabold text-primary">{t('signIn')}</Text>
          </Pressable>
        </Link>
        <Link href="/browse" asChild>
          <Pressable className="mt-5 items-center py-2 active:opacity-70">
            <Text className="text-base font-bold text-stone-500 dark:text-stone-400">{t('browseFirst')}</Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}
