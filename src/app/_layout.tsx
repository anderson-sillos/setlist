import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProviders } from '@/providers/AppProviders';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProviders>
        <Stack
          screenOptions={{
            animation: 'slide_from_right',
            fullScreenGestureEnabled: true,
            gestureEnabled: true,
            headerShown: false,
          }}
        />
        <StatusBar style="auto" />
      </AppProviders>
    </SafeAreaProvider>
  );
}
