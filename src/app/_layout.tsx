import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthGate } from '@/features/auth/AuthGate';
import { AuthSessionProvider } from '@/features/auth/AuthSessionProvider';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import { getStackScreenOptions } from '@/features/navigation/stackOptions';
import { AppProviders } from '@/providers/AppProviders';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export const rootStackScreenOptions = getStackScreenOptions(Platform.OS, false);

export default function RootLayout() {
  const reducedMotion = useReducedMotionPreference();
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Setlist';
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthSessionProvider>
          <AppProviders>
            <AuthGate>
              <Stack
                screenOptions={getStackScreenOptions(
                  Platform.OS,
                  reducedMotion,
                )}
              />
            </AuthGate>
            <StatusBar style="auto" />
          </AppProviders>
        </AuthSessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
