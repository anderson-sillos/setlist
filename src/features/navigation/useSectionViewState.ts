import { useCallback, useState } from 'react';

import type { EntityId } from '@/domain';
import { useNavigationMemory } from '@/features/navigation/NavigationMemory';
import type { BandSection } from '@/features/navigation/routes';

export function useSectionViewState<State extends Record<string, string>>(
  bandId: EntityId,
  section: BandSection,
  defaults: State,
) {
  const navigationMemory = useNavigationMemory();
  const [state, setState] = useState<State>(() => ({
    ...defaults,
    ...navigationMemory.getSectionMemory(bandId, section).viewState,
  }));

  const update = useCallback(
    <Key extends keyof State>(key: Key, value: State[Key]) => {
      setState((current) => {
        const next = { ...current, [key]: value };
        navigationMemory.rememberViewState(bandId, section, next);
        return next;
      });
    },
    [bandId, navigationMemory, section],
  );

  const rememberScrollOffset = useCallback(
    (offset: number) =>
      navigationMemory.rememberScrollOffset(bandId, section, offset),
    [bandId, navigationMemory, section],
  );

  return {
    initialScrollOffset:
      navigationMemory.getSectionMemory(bandId, section).scrollOffset ?? 0,
    rememberScrollOffset,
    state,
    update,
  };
}
