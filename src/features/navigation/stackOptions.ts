import type { Platform } from 'react-native';
import { motion } from '@/theme/tokens';

type PlatformName = typeof Platform.OS;

export function getStackScreenOptions(
  platform: PlatformName,
  reducedMotion: boolean,
) {
  return {
    ...(platform === 'web' || reducedMotion
      ? { animationDuration: reducedMotion ? 0 : motion.navigation }
      : {}),
    animation: reducedMotion
      ? ('none' as const)
      : platform === 'web'
        ? ('fade' as const)
        : ('default' as const),
    fullScreenGestureEnabled: true,
    gestureEnabled: true,
    headerShown: false,
  };
}
