import { useState } from 'react';
import { Dimensions, ScrollView, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { CachedImage } from '@/components/CachedImage';

/** Paging photo carousel with dot indicators; falls back to a crop emoji when empty. */
export function PhotoCarousel({ urls, height = 240 }: { urls?: string[]; height?: number }) {
  const [index, setIndex] = useState(0);
  const width = Dimensions.get('window').width - 32;
  const photos = urls ?? [];

  if (photos.length === 0) {
    return (
      <View className="items-center justify-center overflow-hidden rounded-2xl bg-green-100 dark:bg-green-950" style={{ height }}>
        <Text className="text-6xl">🌱</Text>
      </View>
    );
  }

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        className="overflow-hidden rounded-2xl"
        style={{ height }}
      >
        {photos.map((url) => (
          <CachedImage key={url} source={{ uri: url }} style={{ width, height }} />
        ))}
      </ScrollView>

      {photos.length > 1 ? (
        <View className="mt-2.5 flex-row justify-center gap-1.5">
          {photos.map((url, dotIndex) => (
            <View
              key={url}
              className={`h-1.5 rounded-full ${dotIndex === index ? 'w-5 bg-primary' : 'w-1.5 bg-stone-300 dark:bg-stone-700'}`}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
