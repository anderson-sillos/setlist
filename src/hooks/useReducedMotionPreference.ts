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

    void AccessibilityInfo.isReduceMotionEnabled()
      .then(setReducedMotion)
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion,
    );
    return () => subscription.remove();
  }, []);

  return reducedMotion;
}
