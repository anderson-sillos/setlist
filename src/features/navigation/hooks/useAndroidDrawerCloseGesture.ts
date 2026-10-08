import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, Platform } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';

import {
  androidDrawerGesture,
  completesAndroidDrawerGesture,
} from '@/features/navigation/drawerGestures';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import { motion } from '@/theme/tokens';

interface AndroidDrawerCloseGestureOptions {
  readonly closing: boolean;
  readonly onClose: () => void;
  readonly translateX: Animated.Value;
  readonly visible: boolean;
  readonly width: number;
}

export function useAndroidDrawerCloseGesture({
  closing,
  onClose,
  translateX,
  visible,
  width,
}: AndroidDrawerCloseGestureOptions) {
  const reducedMotion = useReducedMotionPreference();
  const dragging = useRef(false);
  const restoreAnimation = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!visible || closing) {
      dragging.current = false;
      restoreAnimation.current?.stop();
    }
    return () => restoreAnimation.current?.stop();
  }, [closing, visible]);

  const restoreDrawer = useCallback(() => {
    if (closing || !visible) return;
    restoreAnimation.current?.stop();
    if (reducedMotion) {
      translateX.setValue(0);
      return;
    }
    restoreAnimation.current = Animated.timing(translateX, {
      duration: motion.layerClose,
      toValue: 0,
      useNativeDriver: true,
    });
    restoreAnimation.current.start();
  }, [closing, reducedMotion, translateX, visible]);

  const startDrag = useCallback(() => {
    if (closing || !visible) return;
    dragging.current = true;
    restoreAnimation.current?.stop();
    translateX.stopAnimation();
  }, [closing, translateX, visible]);

  const updateDrag = useCallback(
    ({ translationX }: { readonly translationX: number }) => {
      if (!dragging.current) return;
      translateX.setValue(Math.max(-width, Math.min(0, translationX)));
    },
    [translateX, width],
  );

  const endDrag = useCallback(
    (
      {
        translationX,
        translationY,
        velocityX,
      }: {
        readonly translationX: number;
        readonly translationY: number;
        readonly velocityX: number;
      },
      success: boolean,
    ) => {
      if (!dragging.current) return;
      dragging.current = false;
      if (
        success &&
        completesAndroidDrawerGesture({
          direction: 'close',
          translationX,
          translationY,
          velocityX,
        })
      ) {
        onClose();
        return;
      }
      restoreDrawer();
    },
    [onClose, restoreDrawer],
  );

  const finalizeDrag = useCallback(() => {
    if (dragging.current) {
      dragging.current = false;
      restoreDrawer();
    }
  }, [restoreDrawer]);

  return useMemo(
    () =>
      Gesture.Pan()
        .enabled(Platform.OS === 'android' && visible && !closing)
        .activeOffsetX(-androidDrawerGesture.activationDistance)
        .failOffsetY([
          -androidDrawerGesture.verticalTolerance,
          androidDrawerGesture.verticalTolerance,
        ])
        .maxPointers(1)
        .shouldCancelWhenOutside(false)
        .runOnJS(true)
        // Estes métodos registram callbacks; refs só são usadas nos eventos.
        // eslint-disable-next-line react-hooks/refs
        .onStart(startDrag)
        // eslint-disable-next-line react-hooks/refs
        .onUpdate(updateDrag)
        // eslint-disable-next-line react-hooks/refs
        .onEnd(endDrag)
        // eslint-disable-next-line react-hooks/refs
        .onFinalize(finalizeDrag),
    [closing, endDrag, finalizeDrag, startDrag, updateDrag, visible],
  );
}
