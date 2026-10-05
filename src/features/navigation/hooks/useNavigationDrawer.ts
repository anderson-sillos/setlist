import { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, PanResponder } from 'react-native';

import type { NavigationScreenKind } from '@/features/navigation/types';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import { motion } from '@/theme/tokens';

interface UseNavigationDrawerOptions {
  readonly persistentSidebar: boolean;
  readonly screenKind: NavigationScreenKind;
  readonly width: number;
}

export function useNavigationDrawer({
  persistentSidebar,
  screenKind,
  width,
}: UseNavigationDrawerOptions) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTranslateX] = useState(() => new Animated.Value(-360));
  const reducedMotion = useReducedMotionPreference();

  const openDrawer = useCallback(() => {
    drawerTranslateX.setValue(reducedMotion ? 0 : -Math.min(width * 0.86, 360));
    setDrawerOpen(true);
  }, [drawerTranslateX, reducedMotion, width]);

  const closeDrawer = useCallback(() => {
    if (reducedMotion) {
      setDrawerOpen(false);
      return;
    }
    Animated.timing(drawerTranslateX, {
      duration: motion.layerClose,
      toValue: -Math.min(width * 0.86, 360),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setDrawerOpen(false);
      }
    });
  }, [drawerTranslateX, reducedMotion, width]);

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }

    if (reducedMotion) {
      drawerTranslateX.setValue(0);
      return;
    }
    const animation = Animated.timing(drawerTranslateX, {
      duration: motion.layerOpen,
      toValue: 0,
      useNativeDriver: true,
    });

    animation.start();
    return () => animation.stop();
  }, [drawerOpen, drawerTranslateX, reducedMotion]);

  const edgeGesture = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          screenKind === 'main' &&
          !persistentSidebar &&
          gesture.dx > 12 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx >= 40) {
            openDrawer();
          }
        },
      }),
    [openDrawer, persistentSidebar, screenKind],
  );

  return {
    closeDrawer,
    drawerOpen,
    drawerTranslateX,
    edgeGesture,
    openDrawer,
  };
}
