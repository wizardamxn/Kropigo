import type { PropsWithChildren } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslations } from 'use-intl';
import { CachedImage } from '@/components/CachedImage';
import { useThemePreference, type ThemePreference } from '@/providers/ThemeProvider';
import { LOCALES, useLocalePreference } from '@/providers/LocaleProvider';
import { useLogout } from '@/hooks/useLogout';
import type { AuthUser } from '@/store/authSlice';
import { Button, Card, SectionTitle, type Accent } from '@/components/ui';

const THEMES: ThemePreference[] = ['light', 'dark', 'system'];
const LOCALE_LABELS: Record<(typeof LOCALES)[number], string> = { en: 'English', hi: 'हिन्दी' };

/** Avatar + verification status + email/phone block shared by both role profiles. */
export function ProfileIdentity({ user, photoUrl, accent }: {
  user: AuthUser | null; photoUrl?: string; accent: Accent;
}) {
  const t = useTranslations('mobile.profile');
  const initial = (user?.name ?? user?.email ?? 'K').charAt(0).toUpperCase();
  const accentRing = accent === 'green' ? 'bg-green-50 dark:bg-green-950' : 'bg-amber-50 dark:bg-amber-950';

  return (
    <Card>
      <View className="items-center">
        <View className={`h-24 w-24 items-center justify-center overflow-hidden rounded-full ${accentRing}`}>
          {photoUrl ? (
            <CachedImage source={{ uri: photoUrl }} className="h-full w-full" />
          ) : (
            <Text className="text-4xl font-extrabold text-primary">{initial}</Text>
          )}
        </View>

        <Text className="mt-3 text-2xl font-extrabold text-stone-900 dark:text-stone-50">{user?.name ?? 'Your account'}</Text>
        <Text className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">{user?.role}</Text>

        <View className={`mt-3 flex-row items-center gap-1.5 rounded-full px-3 py-1 ${
          user?.isVerified ? 'bg-green-50 dark:bg-green-950' : 'bg-amber-50 dark:bg-amber-950'
        }`}>
          <Ionicons
            name={user?.isVerified ? 'checkmark-circle' : 'time-outline'}
            size={14}
            color={user?.isVerified ? '#166534' : '#b45309'}
          />
          <Text className={`text-xs font-bold ${user?.isVerified ? 'text-primary' : 'text-amber-700 dark:text-amber-500'}`}>
            {user?.isVerified ? t('verified') : t('pending')}
          </Text>
        </View>

        {user?.username ? (
          <View className="mt-3 w-full rounded-xl bg-green-50 px-3 py-2 dark:bg-green-950">
            <Text className="text-center text-[10px] font-bold uppercase tracking-wider text-primary">{t('kropigoId')}</Text>
            <Text className="text-center text-lg font-extrabold tracking-widest text-primary">{user.username}</Text>
          </View>
        ) : null}
      </View>

      <View className="mt-5 gap-3 border-t border-stone-100 pt-4 dark:border-stone-800">
        <Detail label={t('email')} value={user?.email} />
        <Detail label={t('phone')} value={user?.phone} />
      </View>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <View>
      <Text className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">{label}</Text>
      <Text className="font-semibold text-stone-800 dark:text-stone-200">{value ?? '—'}</Text>
    </View>
  );
}

/** Appearance toggle + sign out, rendered at the bottom of both role profiles. */
export function ProfileSettings({ accent, children }: PropsWithChildren<{ accent: Accent }>) {
  const t = useTranslations('mobile.profile');
  const tActions = useTranslations('mobile.actions');
  const { preference, setPreference } = useThemePreference();
  const { locale, setLocale } = useLocalePreference();
  const logout = useLogout();

  const activeClass = accent === 'green' ? 'bg-primary' : 'bg-amber-700 dark:bg-amber-600';

  return (
    <>
      <Card>
        <SectionTitle>{t('language')}</SectionTitle>
        <View className="h-12 flex-row overflow-hidden rounded-xl border border-stone-300 dark:border-stone-700">
          {LOCALES.map((option, index) => {
            const active = option === locale;
            return (
              <Pressable
                key={option}
                onPress={() => setLocale(option)}
                className={`flex-1 items-center justify-center ${active ? activeClass : 'bg-white dark:bg-stone-900'} ${
                  index > 0 ? 'border-l border-stone-300 dark:border-stone-700' : ''
                }`}
              >
                <Text className={`text-sm font-bold ${active ? 'text-white' : 'text-stone-600 dark:text-stone-300'}`}>
                  {LOCALE_LABELS[option]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="mt-5">
          <SectionTitle>{t('appearance')}</SectionTitle>
          <View className="h-12 flex-row overflow-hidden rounded-xl border border-stone-300 dark:border-stone-700">
            {THEMES.map((option, index) => {
              const active = option === preference;
              return (
                <Pressable
                  key={option}
                  onPress={() => setPreference(option)}
                  className={`flex-1 items-center justify-center ${active ? activeClass : 'bg-white dark:bg-stone-900'} ${
                    index > 0 ? 'border-l border-stone-300 dark:border-stone-700' : ''
                  }`}
                >
                  <Text className={`text-sm font-bold ${active ? 'text-white' : 'text-stone-600 dark:text-stone-300'}`}>
                    {t(option)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        {children}
      </Card>

      <Button label={tActions('signOut')} variant="danger" icon="log-out-outline" onPress={logout} />
    </>
  );
}
