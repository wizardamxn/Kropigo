import '../global.css';
import { useCallback } from 'react';
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toaster } from 'sonner-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Geist_100Thin, Geist_200ExtraLight, Geist_300Light, Geist_400Regular, Geist_500Medium,
  Geist_600SemiBold, Geist_700Bold, Geist_800ExtraBold, Geist_900Black,
} from '@expo-google-fonts/geist';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { Caveat_600SemiBold } from '@expo-google-fonts/caveat';
import { store } from '@/store';
import { SocketProvider } from '@/providers/SocketProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { LocaleProvider } from '@/providers/LocaleProvider';
import { LaunchGate } from '@/components/LaunchGate';

// Hold the native splash until the fonts are ready, so no screen renders in a
// fallback face and then reflows.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Geist_100Thin, Geist_200ExtraLight, Geist_300Light, Geist_400Regular, Geist_500Medium,
    Geist_600SemiBold, Geist_700Bold, Geist_800ExtraBold, Geist_900Black,
    Fraunces_600SemiBold, Caveat_600SemiBold,
  });

  const onLayout = useCallback(() => {
    // A font failure must not brick the app — render with system faces instead.
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayout}>
      <Provider store={store}>
        <LocaleProvider>
          <ThemeProvider>
            <SafeAreaProvider>
              <LaunchGate>
                <SocketProvider>
                  <StatusBar style="auto" />
                  <Stack screenOptions={{ headerShown: false }} />
                </SocketProvider>
              </LaunchGate>
              {/* Outside LaunchGate — that gate unmounts its children, which would
                  take the toaster with it and swallow any error raised while gated. */}
              <Toaster position="top-center" richColors />
            </SafeAreaProvider>
          </ThemeProvider>
        </LocaleProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
