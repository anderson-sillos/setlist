import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
      <AppProviders>
        <Stack screenOptions={rootStackScreenOptions} />
        <StatusBar style="auto" />
      </AppProviders>
    </SafeAreaProvider>
  );
}
