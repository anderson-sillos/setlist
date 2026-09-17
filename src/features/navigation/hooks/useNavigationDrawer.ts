import { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, PanResponder } from 'react-native';

import type { NavigationScreenKind } from '@/features/navigation/types';

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

  const openDrawer = useCallback(() => {
    drawerTranslateX.setValue(-Math.min(width * 0.86, 360));
    setDrawerOpen(true);
  }, [drawerTranslateX, width]);

  const closeDrawer = useCallback(() => {
    Animated.timing(drawerTranslateX, {
      duration: 180,
      toValue: -Math.min(width * 0.86, 360),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setDrawerOpen(false);
      }
    });
  }, [drawerTranslateX, width]);

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }

    const animation = Animated.timing(drawerTranslateX, {
      duration: 240,
      toValue: 0,
      useNativeDriver: true,
    });

    animation.start();
    return () => animation.stop();
  }, [drawerOpen, drawerTranslateX]);

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
