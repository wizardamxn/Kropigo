import { Image as ExpoImage, type ImageProps } from 'expo-image';
import { cssInterop } from 'nativewind';

// expo-image isn't one of NativeWind's built-in components, so `className` has to
// be mapped onto `style` explicitly — done once here rather than at each usage.
cssInterop(ExpoImage, { className: 'style' });

/**
 * Drop-in replacement for RN's `Image` that caches to disk, so listing photos
 * survive scrolling and app restarts instead of re-downloading — the difference
 * is significant on the rural connections this app targets.
 */
export function CachedImage({ contentFit = 'cover', ...props }: ImageProps) {
  return <ExpoImage cachePolicy="memory-disk" transition={150} contentFit={contentFit} {...props} />;
}
