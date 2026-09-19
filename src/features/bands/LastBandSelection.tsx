import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import type { EntityId } from '@/domain';

import {
  clearLastBandId,
  readLastBandId,
  writeLastBandId,
} from './lastBandStorage';

interface LastBandSelectionContextValue {
  readonly clearLastBand: () => Promise<void>;
  readonly isHydrated: boolean;
  readonly lastBandId: EntityId | null;
  readonly setLastBand: (bandId: EntityId) => Promise<void>;
}

const LastBandSelectionContext = createContext<
  LastBandSelectionContextValue | undefined
>(undefined);

export function LastBandSelectionProvider({ children }: PropsWithChildren) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [lastBandId, setLastBandId] = useState<EntityId | null>(null);

  useEffect(() => {
    let active = true;

    void readLastBandId().then((storedBandId) => {
      if (!active) {
        return;
      }

      setLastBandId(storedBandId);
      setIsHydrated(true);
    });

    return () => {
      active = false;
    };
  }, []);

  const setLastBand = useCallback(async (bandId: EntityId) => {
    setLastBandId(bandId);
    await writeLastBandId(bandId);
  }, []);

  const clearLastBand = useCallback(async () => {
    setLastBandId(null);
    await clearLastBandId();
  }, []);

  const value = useMemo(
    () => ({ clearLastBand, isHydrated, lastBandId, setLastBand }),
    [clearLastBand, isHydrated, lastBandId, setLastBand],
  );

  return (
    <LastBandSelectionContext.Provider value={value}>
      {children}
    </LastBandSelectionContext.Provider>
  );
}

export function useLastBandSelection(): LastBandSelectionContextValue {
  const value = useContext(LastBandSelectionContext);

  if (!value) {
    throw new Error(
      'useLastBandSelection deve ser usado dentro de LastBandSelectionProvider.',
    );
  }

  return value;
}
