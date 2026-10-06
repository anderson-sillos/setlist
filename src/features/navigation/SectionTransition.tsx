import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';

import type { BandSection } from '@/features/navigation/routes';

export type ReplaceAnimationType = 'push' | 'pop';

interface SectionTransitionValue {
  readonly animationTypeForReplace: ReplaceAnimationType;
  readonly resetSectionTransition: () => void;
  readonly setSectionTransition: (
    current: BandSection,
    target: BandSection,
  ) => void;
}

const sectionOrder: Partial<Record<BandSection, number>> = {
  shows: 0,
  repertoire: 1,
  band: 2,
};

const SectionTransitionContext = createContext<SectionTransitionValue | null>(
  null,
);

export function SectionTransitionProvider({ children }: PropsWithChildren) {
  const [animationTypeForReplace, setAnimationTypeForReplace] =
    useState<ReplaceAnimationType>('push');
  const resetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetSectionTransition = useCallback(() => {
    if (resetTimeout.current) {
      clearTimeout(resetTimeout.current);
      resetTimeout.current = null;
    }

    setAnimationTypeForReplace('push');
  }, []);

  const setSectionTransition = useCallback(
    (current: BandSection, target: BandSection) => {
      const currentPosition = sectionOrder[current];
      const targetPosition = sectionOrder[target];

      if (
        Platform.OS === 'web' ||
        currentPosition === undefined ||
        targetPosition === undefined ||
        currentPosition === targetPosition
      ) {
        resetSectionTransition();
        return;
      }

      setAnimationTypeForReplace(
        targetPosition > currentPosition ? 'push' : 'pop',
      );

      if (resetTimeout.current) {
        clearTimeout(resetTimeout.current);
      }

      resetTimeout.current = setTimeout(resetSectionTransition, 1200);
    },
    [resetSectionTransition],
  );

  useEffect(
    () => () => {
      if (resetTimeout.current) {
        clearTimeout(resetTimeout.current);
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      animationTypeForReplace,
      resetSectionTransition,
      setSectionTransition,
    }),
    [animationTypeForReplace, resetSectionTransition, setSectionTransition],
  );

  return (
    <SectionTransitionContext.Provider value={value}>
      {children}
    </SectionTransitionContext.Provider>
  );
}

const noSectionTransition: SectionTransitionValue = {
  animationTypeForReplace: 'push',
  resetSectionTransition: () => undefined,
  setSectionTransition: () => undefined,
};

export function useSectionTransition(): SectionTransitionValue {
  return useContext(SectionTransitionContext) ?? noSectionTransition;
}
