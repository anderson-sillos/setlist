import { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, PanResponder, Platform } from 'react-native';

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
  const [drawerClosing, setDrawerClosing] = useState(false);
  const [drawerTranslateX] = useState(() => new Animated.Value(-360));
  const reducedMotion = useReducedMotionPreference();

  const openDrawer = useCallback(() => {
    drawerTranslateX.stopAnimation();
    drawerTranslateX.setValue(reducedMotion ? 0 : -Math.min(width * 0.86, 360));
    setDrawerClosing(false);
    setDrawerOpen(true);
  }, [drawerTranslateX, reducedMotion, width]);

  const closeDrawer = useCallback(() => {
    setDrawerClosing(true);
  }, []);

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }

    if (reducedMotion) {
      if (drawerClosing) {
        drawerTranslateX.stopAnimation(() => {
          drawerTranslateX.setValue(-Math.min(width * 0.86, 360));
          setDrawerClosing(false);
          setDrawerOpen(false);
        });
        return;
      }
      drawerTranslateX.setValue(0);
      return;
    }
    if (drawerClosing) {
      const animation = Animated.timing(drawerTranslateX, {
        duration: motion.layerClose,
        toValue: -Math.min(width * 0.86, 360),
        useNativeDriver: true,
      });

      animation.start(({ finished }) => {
        if (finished) {
          setDrawerClosing(false);
          setDrawerOpen(false);
        }
      });
      return () => animation.stop();
    }
    const animation = Animated.timing(drawerTranslateX, {
      duration: motion.layerOpen,
      toValue: 0,
      useNativeDriver: true,
    });

    animation.start();
    return () => animation.stop();
  }, [drawerClosing, drawerOpen, drawerTranslateX, reducedMotion, width]);

  const edgeGesture = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Platform.OS !== 'ios' &&
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
