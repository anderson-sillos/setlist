import { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, PanResponder, Platform } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';

import {
  androidDrawerGesture,
  completesAndroidDrawerGesture,
} from '@/features/navigation/drawerGestures';
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
          gesture.dx >
            (Platform.OS === 'android'
              ? androidDrawerGesture.activationDistance
              : 12) &&
          Math.abs(gesture.dx) >
            Math.abs(gesture.dy) *
              (Platform.OS === 'android'
                ? androidDrawerGesture.horizontalRatio
                : 1),
        onPanResponderRelease: (_, gesture) => {
          const completed =
            Platform.OS === 'android'
              ? completesAndroidDrawerGesture({
                  direction: 'open',
                  translationX: gesture.dx,
                  translationY: gesture.dy,
                  velocityX: gesture.vx * 1000,
                })
              : gesture.dx >= 40;
          if (completed) {
            openDrawer();
          }
        },
      }),
    [openDrawer, persistentSidebar, screenKind],
  );

  const androidEdgeGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(
          Platform.OS === 'android' &&
            screenKind === 'main' &&
            !persistentSidebar &&
            !drawerOpen,
        )
        .activeOffsetX(androidDrawerGesture.activationDistance)
        .failOffsetY([
          -androidDrawerGesture.verticalTolerance,
          androidDrawerGesture.verticalTolerance,
        ])
        .maxPointers(1)
        .shouldCancelWhenOutside(false)
        .runOnJS(true)
        .onEnd(({ translationX, translationY, velocityX }, success) => {
          if (
            success &&
            completesAndroidDrawerGesture({
              direction: 'open',
              translationX,
              translationY,
              velocityX,
            })
          ) {
            openDrawer();
          }
        }),
    [drawerOpen, openDrawer, persistentSidebar, screenKind],
  );

  return {
    androidEdgeGesture,
    closeDrawer,
    drawerClosing,
    drawerOpen,
    drawerTranslateX,
    edgeGesture,
    openDrawer,
  };
}
