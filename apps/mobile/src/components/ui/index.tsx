import type { ComponentProps, PropsWithChildren, ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { CachedImage } from '@/components/CachedImage';

/** Accent per role group — kisan is green, buyer is amber (mirrors the web dashboards). */
export type Accent = 'green' | 'amber';

export const accentText: Record<Accent, string> = {
  green: 'text-primary',
  amber: 'text-amber-700 dark:text-amber-500',
};

export const accentBg: Record<Accent, string> = {
  green: 'bg-primary',
  amber: 'bg-amber-700 dark:bg-amber-600',
};

export const accentHex: Record<Accent, string> = {
  green: '#166534',
  amber: '#b45309',
};

// ─── Layout ───────────────────────────────────────────────────────────────────

export function Screen({ children, edges = ['top'] }: PropsWithChildren<{ edges?: ('top' | 'bottom')[] }>) {
  return (
    <SafeAreaView className="flex-1 bg-stone-50 dark:bg-stone-950" edges={edges}>
      {children}
    </SafeAreaView>
  );
}

/** Sticky screen title block. Keeps the 18px gutter every list/detail screen uses. */
export function PageHeader({ title, subtitle, right, children }: PropsWithChildren<{
  title: string; subtitle?: string; right?: ReactNode;
}>) {
  return (
    <View className="border-b border-stone-200 bg-white px-[18px] pb-3 pt-[18px] dark:border-stone-800 dark:bg-stone-900">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-3xl font-extrabold text-stone-900 dark:text-stone-50">{title}</Text>
          {subtitle ? <Text className="mt-0.5 text-stone-500 dark:text-stone-400">{subtitle}</Text> : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

export function BackLink({ label, accent = 'green' }: { label: string; accent?: Accent }) {
  return (
    <Pressable onPress={() => router.back()} className="self-start py-1">
      <Text className={`font-bold ${accentText[accent]}`}>‹ {label}</Text>
    </Pressable>
  );
}

export function Card({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return (
    <View className={`rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 ${className}`}>
      {children}
    </View>
  );
}

export function SectionTitle({ children }: PropsWithChildren) {
  return <Text className="mb-3 text-lg font-extrabold text-stone-900 dark:text-stone-50">{children}</Text>;
}

/**
 * The row shape every list screen shares: a media tile, a title line with an
 * optional trailing badge, then caller-supplied detail lines.
 *
 * The tile is a fixed square on purpose. It used to be a full-bleed column with
 * no height of its own, so inside the row it stretched to whatever the text
 * beside it happened to measure — every row came out a different height with its
 * photo cropped to a different aspect ratio.
 */
export function ListRow({ media, fallback = '🌱', title, badge, onPress, children }: PropsWithChildren<{
  media?: string; fallback?: string; title: string; badge?: ReactNode; onPress?: () => void;
}>) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 active:opacity-90 dark:border-stone-800 dark:bg-stone-900"
    >
      <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-green-50 dark:bg-green-950">
        {media ? (
          <CachedImage source={{ uri: media }} className="h-full w-full" />
        ) : (
          <Text className="text-3xl">{fallback}</Text>
        )}
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between gap-2">
          <Text className="flex-1 text-[15px] font-extrabold text-stone-900 dark:text-stone-50" numberOfLines={1}>
            {title}
          </Text>
          {badge}
        </View>
        {children}
      </View>
    </Pressable>
  );
}

/** Small uppercase caption used above values inside cards. */
export function Caption({ children }: PropsWithChildren) {
  return <Text className="text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">{children}</Text>;
}

export function KeyValueRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View className="mt-1.5 flex-row items-center justify-between gap-3">
      <Text className="text-stone-500 dark:text-stone-400">{label}</Text>
      <Text className={`flex-1 text-right font-bold ${strong ? 'text-primary' : 'text-stone-900 dark:text-stone-50'}`}>{value}</Text>
    </View>
  );
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

export function Loading({ accent = 'green' }: { accent?: Accent }) {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator color={accentHex[accent]} />
    </View>
  );
}

export function ErrorState({ message, onRetry, accent = 'green' }: { message: string; onRetry?: () => void; accent?: Accent }) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Ionicons name="cloud-offline-outline" size={40} color="#a8a29e" />
      <Text className="mt-3 text-center text-stone-700 dark:text-stone-300">{message}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} className="mt-3 py-1">
          <Text className={`font-bold ${accentText[accent]}`}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({ icon = 'file-tray-outline', title, subtitle, action }: {
  icon?: ComponentProps<typeof Ionicons>['name']; title: string; subtitle?: string; action?: ReactNode;
}) {
  return (
    <View className="items-center px-8 py-10">
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-900">
        <Ionicons name={icon} size={26} color="#a8a29e" />
      </View>
      <Text className="mt-4 text-center text-base font-bold text-stone-800 dark:text-stone-200">{title}</Text>
      {subtitle ? <Text className="mt-1 text-center text-stone-500 dark:text-stone-400">{subtitle}</Text> : null}
      {action ? <View className="mt-4">{action}</View> : null}
    </View>
  );
}

/**
 * Row spacing for FlashList. It positions recycled cells absolutely, so a `gap`
 * in contentContainerStyle has no effect — separators are the supported route.
 */
export function ListGap() {
  return <View className="h-3" />;
}

export function StatCard({ label, value, accent = 'green' }: { label: string; value: string | number; accent?: Accent }) {
  return (
    <View className="flex-1 rounded-2xl border border-stone-200 bg-white p-3.5 dark:border-stone-800 dark:bg-stone-900">
      <Text className={`text-2xl font-extrabold ${accentText[accent]}`} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text className="mt-0.5 text-xs font-semibold text-stone-500 dark:text-stone-400">{label}</Text>
    </View>
  );
}

export function Badge({ label, className = '' }: { label: string; className?: string }) {
  return (
    <Text className={`self-start overflow-hidden rounded-full px-2 py-0.5 text-[11px] font-extrabold ${className}`}>{label}</Text>
  );
}

// ─── Controls ─────────────────────────────────────────────────────────────────

export function Button({ label, onPress, loading, disabled, variant = 'primary', accent = 'green', icon }: {
  label: string; onPress: () => void; loading?: boolean; disabled?: boolean;
  variant?: 'primary' | 'outline' | 'danger' | 'ghost'; accent?: Accent;
  icon?: ComponentProps<typeof Ionicons>['name'];
}) {
  const isDisabled = disabled || loading;
  const base = 'h-12 flex-row items-center justify-center gap-2 rounded-xl px-4 active:opacity-90';
  const variants = {
    primary: `${accentBg[accent]}`,
    outline: 'border border-stone-300 bg-white dark:border-stone-700 dark:bg-stone-900',
    danger: 'border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950',
    ghost: '',
  } as const;
  const labelColors = {
    primary: 'text-white',
    outline: 'text-stone-800 dark:text-stone-200',
    danger: 'text-red-700 dark:text-red-400',
    ghost: accentText[accent],
  } as const;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`${base} ${variants[variant]} ${isDisabled ? 'opacity-60' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : accentHex[accent]} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={variant === 'primary' ? '#fff' : variant === 'danger' ? '#b91c1c' : accentHex[accent]} /> : null}
          <Text className={`text-base font-bold ${labelColors[variant]}`}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Input({ className, ...props }: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor="#a8a29e"
      className={`h-12 rounded-xl border border-stone-300 bg-white px-3.5 text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50 ${className ?? ''}`}
      {...props}
    />
  );
}

export function Field({ label, error, hint, children }: PropsWithChildren<{ label: string; error?: string; hint?: string }>) {
  return (
    <View className="mt-4">
      <Text className="mb-1.5 font-semibold text-stone-800 dark:text-stone-200">{label}</Text>
      {children}
      {hint && !error ? <Text className="mt-1 text-xs text-stone-500 dark:text-stone-400">{hint}</Text> : null}
      {error ? <Text className="mt-1 text-xs font-semibold text-red-700 dark:text-red-400">{error}</Text> : null}
    </View>
  );
}

/** Compact inline segmented control for short enum choices (unit, grade…). */
export function Segmented<T extends string>({ options, value, onChange, accent = 'green' }: {
  options: readonly T[]; value: T; onChange: (value: T) => void; accent?: Accent;
}) {
  return (
    <View className="h-12 flex-row overflow-hidden rounded-xl border border-stone-300 dark:border-stone-700">
      {options.map((option, index) => {
        const active = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            className={`flex-1 items-center justify-center ${active ? accentBg[accent] : 'bg-white dark:bg-stone-900'} ${
              index > 0 ? 'border-l border-stone-300 dark:border-stone-700' : ''
            }`}
          >
            <Text className={`text-sm font-bold ${active ? 'text-white' : 'text-stone-600 dark:text-stone-300'}`}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Horizontal pill row used for status/segment filters. */
export function Chips<T extends string | undefined>({ options, value, onChange, accent = 'green' }: {
  options: Array<{ label: string; value: T }>; value: T; onChange: (value: T) => void; accent?: Accent;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 18 }}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.label}
            onPress={() => onChange(option.value)}
            className={`h-9 justify-center rounded-full px-3.5 ${active ? accentBg[accent] : 'bg-stone-100 dark:bg-stone-800'}`}
          >
            <Text className={`text-xs font-bold ${active ? 'text-white' : 'text-stone-600 dark:text-stone-300'}`}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
