import type { Platform } from 'react-native';

import type { ReplaceAnimationType } from '@/features/navigation/SectionTransition';
import { motion } from '@/theme/tokens';

type PlatformName = typeof Platform.OS;

export function getStackScreenOptions(
  platform: PlatformName,
  reducedMotion: boolean,
  animationTypeForReplace: ReplaceAnimationType = 'push',
) {
  return {
    ...(platform === 'web' || reducedMotion
      ? { animationDuration: reducedMotion ? 0 : motion.navigation }
      : {}),
    animation: reducedMotion
      ? ('none' as const)
      : platform === 'web'
        ? ('fade' as const)
        : platform === 'android'
          ? ('slide_from_right' as const)
          : ('default' as const),
    ...(platform === 'ios' || platform === 'android'
      ? { animationTypeForReplace }
      : {}),
    fullScreenGestureEnabled: false,
    gestureEnabled: true,
    headerShown: false,
  };
}
