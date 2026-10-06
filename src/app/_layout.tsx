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
import {
  SectionTransitionProvider,
  useSectionTransition,
} from '@/features/navigation/SectionTransition';
import { AppProviders } from '@/providers/AppProviders';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export const rootStackScreenOptions = getStackScreenOptions(Platform.OS, false);

function RootStack({ reducedMotion }: { readonly reducedMotion: boolean }) {
  const { animationTypeForReplace, resetSectionTransition } =
    useSectionTransition();

  return (
    <Stack
      screenListeners={{ transitionEnd: resetSectionTransition }}
      screenOptions={getStackScreenOptions(
        Platform.OS,
        reducedMotion,
        animationTypeForReplace,
      )}
    >
      <Stack.Screen name="index" options={{ animationTypeForReplace: 'pop' }} />
    </Stack>
  );
}

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
            <SectionTransitionProvider>
              <AuthGate>
                <RootStack reducedMotion={reducedMotion} />
              </AuthGate>
            </SectionTransitionProvider>
            <StatusBar style="auto" />
          </AppProviders>
        </AuthSessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
