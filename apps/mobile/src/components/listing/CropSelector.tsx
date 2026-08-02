import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { useGetCropsQuery, type Crop } from '@/store/cropsApi';
import { useDebounced } from '@/hooks/useDebounced';
import { Input } from '@/components/ui';

/**
 * Debounced crop search rendered as selectable chips. Once a crop is chosen the
 * list collapses to the selection with a "Change" affordance.
 */
export function CropSelector({ value, onChange }: { value?: Crop; onChange: (crop: Crop) => void }) {
  const t = useTranslations('mobile.createListing');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(!value);
  const debouncedSearch = useDebounced(search);
  const { data, isFetching } = useGetCropsQuery(
    { search: debouncedSearch || undefined, limit: 12 },
    { skip: !open },
  );

  if (value && !open) {
    return (
      <View className="flex-row items-center justify-between rounded-xl border border-green-200 bg-green-50 px-3.5 py-3 dark:border-green-900 dark:bg-green-950">
        <View className="flex-1">
          <Text className="text-base font-bold text-stone-900 dark:text-stone-50">{value.name}</Text>
          {value.nameHindi ? <Text className="text-xs text-stone-500 dark:text-stone-400">{value.nameHindi}</Text> : null}
        </View>
        <Pressable onPress={() => setOpen(true)} className="py-1 pl-3">
          <Text className="font-bold text-primary">{t('change')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      <Input value={search} onChangeText={setSearch} placeholder={t('searchCrops')} autoCorrect={false} />
      <View className="mt-2.5 min-h-[44px] flex-row flex-wrap gap-2">
        {isFetching && !data ? (
          <ActivityIndicator color="#166534" style={{ marginTop: 8 }} />
        ) : data?.data.length ? (
          data.data.map((crop) => {
            const selected = crop._id === value?._id;
            return (
              <Pressable
                key={crop._id}
                onPress={() => { onChange(crop); setOpen(false); setSearch(''); }}
                className={`rounded-full px-3.5 py-2 ${selected ? 'bg-primary' : 'bg-stone-100 dark:bg-stone-800'}`}
              >
                <Text className={`text-xs font-bold ${selected ? 'text-white' : 'text-stone-700 dark:text-stone-300'}`}>
                  {crop.name}
                </Text>
              </Pressable>
            );
          })
        ) : (
          <Text className="pt-2 text-sm text-stone-500 dark:text-stone-400">
            {debouncedSearch ? t('noCrops') : t('startTyping')}
          </Text>
        )}
      </View>
    </View>
  );
}
