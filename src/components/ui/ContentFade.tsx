import { useEffect, useRef, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import { motion } from '@/theme/tokens';

interface ContentFadeProps {
  readonly children: ReactNode;
  readonly loading: boolean;
  readonly style?: StyleProp<ViewStyle>;
}

/** Fades in first-load content without replacing its list or scroll container. */
export function ContentFade({ children, loading, style }: ContentFadeProps) {
  const reducedMotion = useReducedMotionPreference();
  const wasLoading = useRef(loading);
  const opacity = useSharedValue(loading ? 0 : 1);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  useEffect(() => {
    if (loading) {
      opacity.set(0);
      wasLoading.current = true;
      return;
    }

    if (reducedMotion) {
      opacity.set(1);
      wasLoading.current = false;
      return;
    }

    if (wasLoading.current) {
      opacity.set(
        withTiming(1, {
          duration: motion.surface,
        }),
      );
      wasLoading.current = false;
    }
  }, [loading, opacity, reducedMotion]);

  return <AnimatedView style={[style, animatedStyle]}>{children}</AnimatedView>;
}

const AnimatedView = Animated.createAnimatedComponent(View);
