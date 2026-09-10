import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
  useRef,
} from 'react';

import type { EntityId } from '@/domain';
import type { BandSection } from '@/features/navigation/routes';

export interface SectionMemory {
  readonly route?: string;
  readonly scrollOffset?: number;
  readonly viewState?: Readonly<Record<string, string>>;
}

interface NavigationMemoryValue {
  getSectionMemory: (bandId: EntityId, section: BandSection) => SectionMemory;
  rememberRoute: (
    bandId: EntityId,
    section: BandSection,
    route: string,
  ) => void;
  rememberScrollOffset: (
    bandId: EntityId,
    section: BandSection,
    offset: number,
  ) => void;
  rememberViewState: (
    bandId: EntityId,
    section: BandSection,
    viewState: Readonly<Record<string, string>>,
  ) => void;
}

const NavigationMemoryContext = createContext<NavigationMemoryValue | null>(
  null,
);

function getMemoryKey(bandId: EntityId, section: BandSection): string {
  return `${bandId}:${section}`;
}

export function NavigationMemoryProvider({ children }: PropsWithChildren) {
  const memory = useRef(new Map<string, SectionMemory>());
  const value = useMemo<NavigationMemoryValue>(
    () => ({
      getSectionMemory: (bandId, section) =>
        memory.current.get(getMemoryKey(bandId, section)) ?? {},
      rememberRoute: (bandId, section, route) => {
        const key = getMemoryKey(bandId, section);
        memory.current.set(key, { ...memory.current.get(key), route });
      },
      rememberScrollOffset: (bandId, section, scrollOffset) => {
        const key = getMemoryKey(bandId, section);
        memory.current.set(key, {
          ...memory.current.get(key),
          scrollOffset: Math.max(0, scrollOffset),
        });
      },
      rememberViewState: (bandId, section, viewState) => {
        const key = getMemoryKey(bandId, section);
        memory.current.set(key, {
          ...memory.current.get(key),
          viewState: {
            ...memory.current.get(key)?.viewState,
            ...viewState,
          },
        });
      },
    }),
    [],
  );

  return (
    <NavigationMemoryContext.Provider value={value}>
      {children}
    </NavigationMemoryContext.Provider>
  );
}

export function useNavigationMemory(): NavigationMemoryValue {
  const value = useContext(NavigationMemoryContext);

  if (!value) {
    throw new Error(
      'useNavigationMemory deve ser usado dentro de NavigationMemoryProvider.',
    );
  }

  return value;
}
