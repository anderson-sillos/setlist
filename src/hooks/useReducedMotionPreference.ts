import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/** Tracks the platform preference so motion can be reduced without restarting. */
export function useReducedMotionPreference() {
  const [reducedMotion, setReducedMotion] = useState(() =>
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (typeof window.matchMedia !== 'function') {
        return;
      }
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      const update = () => setReducedMotion(mediaQuery.matches);
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', update);
        return () => mediaQuery.removeEventListener('change', update);
      }
      mediaQuery.addListener(update);
      return () => mediaQuery.removeListener(update);
    }

    let isActive = true;
    let receivedNativeChange = false;
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (value) => {
        receivedNativeChange = true;
        setReducedMotion(value);
      },
    );

    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (isActive && !receivedNativeChange) {
          setReducedMotion(value);
        }
      })
      .catch(() => undefined);

    return () => {
      isActive = false;
      subscription.remove();
    };
  }, []);

  return reducedMotion;
}
