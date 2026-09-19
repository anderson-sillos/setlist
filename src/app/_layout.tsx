import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthGate } from '@/features/auth/AuthGate';
import { AuthSessionProvider } from '@/features/auth/AuthSessionProvider';
import { AppProviders } from '@/providers/AppProviders';

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
