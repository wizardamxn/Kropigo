import type { PropsWithChildren } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';

export function AuthScreen({ title, subtitle, children, footerHref, footerText, footerAction }: PropsWithChildren<{
  title: string; subtitle: string; footerHref?: '/login' | '/register'; footerText?: string; footerAction?: string;
}>) {
  return (
    <SafeAreaView className="flex-1 bg-stone-50 dark:bg-stone-950">
      <View className="flex-1 justify-center p-6">
        <Text className="mb-6 text-center text-3xl font-extrabold text-primary">KropiGo</Text>
        <View className="rounded-2xl bg-white p-6 shadow-sm dark:bg-stone-900">
          <Text className="text-2xl font-extrabold text-stone-900 dark:text-stone-50">{title}</Text>
          <Text className="mt-1.5 text-stone-500 dark:text-stone-400">{subtitle}</Text>
          {children}
          {footerHref && (
            <Link href={footerHref} asChild>
              <Pressable>
                <Text className="mt-5 text-center text-stone-600 dark:text-stone-400">
                  {footerText} <Text className="font-bold text-primary">{footerAction}</Text>
                </Text>
              </Pressable>
            </Link>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

export function FormLabel({ children }: PropsWithChildren) {
  return <Text className="mb-1.5 mt-4 font-semibold text-stone-800 dark:text-stone-200">{children}</Text>;
}

export function FormInput({ className, ...props }: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor="#a8a29e"
      className={`h-12 rounded-xl border border-stone-300 px-3.5 text-stone-900 dark:border-stone-700 dark:text-stone-50 ${className ?? ''}`}
      {...props}
    />
  );
}

export function FormError({ children }: PropsWithChildren) {
  if (!children) return null;
  return <Text className="mt-1.5 text-red-700 dark:text-red-400">{children}</Text>;
}

export function ApiErrorText({ children }: PropsWithChildren) {
  if (!children) return null;
  return <Text className="mt-4 text-red-700 dark:text-red-400">{children}</Text>;
}

export function SubmitButton({ label, loading, onPress, disabled }: { label: string; loading?: boolean; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      className="mt-6 h-12 items-center justify-center rounded-xl bg-primary active:opacity-90 disabled:opacity-60"
    >
      <Text className="text-base font-bold text-white">{loading ? '…' : label}</Text>
    </Pressable>
  );
}
