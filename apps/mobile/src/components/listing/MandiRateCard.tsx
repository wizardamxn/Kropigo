import { ActivityIndicator, Text, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { useGetMandiRatesQuery } from '@/store/mandiApi';
import { Card } from '@/components/ui';
import { rupees } from '@/lib/format';

/**
 * Live mandi reference prices for the selected crop (last 7 days, newest first).
 * Purely informational — it never blocks the form.
 */
export function MandiRateCard({ cropId, compact }: { cropId?: string; compact?: boolean }) {
  const t = useTranslations('mobile.listingDetail');
  const { data, isLoading, isError } = useGetMandiRatesQuery(cropId as string, { skip: !cropId });

  if (!cropId) return null;

  const rates = data?.data ?? [];
  const latest = rates[0];

  return (
    <Card>
      <Text className="text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">{t('mandiTitle')}</Text>

      {isLoading ? (
        <ActivityIndicator color="#166534" style={{ marginTop: 12, alignSelf: 'flex-start' }} />
      ) : isError || !latest ? (
        <Text className="mt-2 text-sm text-stone-500 dark:text-stone-400">{t('noMandi')}</Text>
      ) : (
        <>
          <View className="mt-2 flex-row items-end gap-2">
            <Text className="text-2xl font-extrabold text-primary">{rupees(latest.modalPrice)}</Text>
            <Text className="pb-1 text-xs text-stone-500 dark:text-stone-400">/ {latest.unit ?? 'quintal'}</Text>
          </View>
          <Text className="mt-0.5 text-sm text-stone-600 dark:text-stone-400">
            Range {rupees(latest.minPrice)} – {rupees(latest.maxPrice)} · {latest.market}
          </Text>

          {!compact && rates.length > 1 ? (
            <View className="mt-3 border-t border-stone-100 pt-2 dark:border-stone-800">
              {rates.slice(0, 5).map((rate) => (
                <View key={rate._id} className="flex-row items-center justify-between py-1">
                  <Text className="flex-1 text-xs text-stone-500 dark:text-stone-400" numberOfLines={1}>
                    {new Date(rate.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {rate.market}
                  </Text>
                  <Text className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    {rupees(rate.minPrice)} – {rupees(rate.maxPrice)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </>
      )}
    </Card>
  );
}
