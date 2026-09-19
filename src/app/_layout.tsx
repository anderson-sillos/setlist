import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthGate } from '@/features/auth/AuthGate';
import { AuthSessionProvider } from '@/features/auth/AuthSessionProvider';
import { AppProviders } from '@/providers/AppProviders';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export const rootStackScreenOptions = {
  animation: 'none' as const,
  fullScreenGestureEnabled: true,
  gestureEnabled: true,
  headerShown: false,
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthSessionProvider>
        <AppProviders>
          <AuthGate>
            <Stack screenOptions={rootStackScreenOptions} />
          </AuthGate>
          <StatusBar style="auto" />
        </AppProviders>
      </AuthSessionProvider>
    </SafeAreaProvider>
  );
}
