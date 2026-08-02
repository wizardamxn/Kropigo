import type { ExpoConfig } from 'expo/config';

/**
 * Config is a .ts file (not app.json) so the Google Maps key can come from the
 * environment. The key is consumed at build time for the Android manifest, not by
 * JS at runtime, so it deliberately has no EXPO_PUBLIC_ prefix — that prefix would
 * additionally inline it into the client bundle for no benefit.
 *
 * Android map loads on the Maps SDK are not billed, but the key still has to exist:
 * without it the map renders as a blank grey grid.
 */
const config: ExpoConfig = {
  name: 'KropiGo',
  slug: 'kropigo',
  scheme: 'kropigo',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  android: {
    package: 'com.kropigo.app',
    config: {
      googleMaps: { apiKey: process.env.GOOGLE_MAPS_API_KEY },
    },
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-dev-client',
    'expo-font',
    'expo-localization',
    // Both of these were being used without their plugin registered, which left
    // the Android permission rationale unset when the OS prompts.
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'KropiGo uses your location to pin your farm so buyers can find it.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'KropiGo needs your photos to add pictures of your crop to a listing.',
        cameraPermission: 'KropiGo needs the camera to photograph your crop and KYC documents.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
