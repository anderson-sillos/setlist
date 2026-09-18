import type { Href } from 'expo-router';
import { useCallback, useEffect } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import type { EntityId } from '@/domain';
import { useNavigationMemory } from '@/features/navigation/NavigationMemory';
import {
  getBandSectionHref,
  type BandSection,
} from '@/features/navigation/routes';
import type { NavigationScreenKind } from '@/features/navigation/types';

interface UseBandNavigationStateOptions {
  readonly activeSection?: BandSection;
  readonly bandId?: EntityId;
  readonly currentRoute?: string;
  readonly screenKind: NavigationScreenKind;
}

export function useBandNavigationState({
  activeSection,
  bandId,
  currentRoute,
  screenKind,
}: UseBandNavigationStateOptions) {
  const navigationMemory = useNavigationMemory();

  useEffect(() => {
    if (bandId && activeSection && currentRoute && screenKind !== 'edit') {
      navigationMemory.rememberRoute(bandId, activeSection, currentRoute);
    }
  }, [activeSection, bandId, currentRoute, navigationMemory, screenKind]);

  const getSectionHref = useCallback(
    (section: BandSection): Href => {
      if (!bandId) {
        return '/' as Href;
      }

      return (navigationMemory.getSectionMemory(bandId, section).route ??
        getBandSectionHref(bandId, section)) as Href;
    },
    [bandId, navigationMemory],
  );

  const initialScrollOffset =
    bandId && activeSection && screenKind === 'main'
      ? (navigationMemory.getSectionMemory(bandId, activeSection)
          .scrollOffset ?? 0)
      : 0;

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (bandId && activeSection && screenKind === 'main') {
        navigationMemory.rememberScrollOffset(
          bandId,
          activeSection,
          event.nativeEvent.contentOffset.y,
        );
      }
    },
    [activeSection, bandId, navigationMemory, screenKind],
  );

  return { getSectionHref, handleScroll, initialScrollOffset };
}
