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
import { colors } from '@/theme/tokens';
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

      const inputFocusStyle = document.createElement('style');
      inputFocusStyle.dataset.setlist = 'web-text-input-focus';
      inputFocusStyle.textContent = `
        input:focus,
        textarea:focus {
          box-shadow: none !important;
        }

        input:focus,
        textarea:focus {
          outline: 2px solid ${colors.border.focus} !important;
          outline-offset: 1px;
        }

        div:has(> [data-testid="search-field-icon"]) > input:focus {
          outline: none !important;
        }
      `;
      document.head.appendChild(inputFocusStyle);

      return () => inputFocusStyle.remove();
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
