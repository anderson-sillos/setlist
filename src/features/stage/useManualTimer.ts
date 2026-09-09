import { useCallback, useEffect, useRef, useState } from 'react';

export type ManualTimerStatus = 'idle' | 'running' | 'paused';

export interface ManualTimerState {
  readonly elapsedMs: number;
  readonly status: ManualTimerStatus;
}

export interface ManualTimer extends ManualTimerState {
  readonly pause: () => void;
  readonly reset: () => void;
  readonly start: () => void;
}

const tickIntervalMs = 250;

export function useManualTimer(): ManualTimer {
  const [state, setState] = useState<ManualTimerState>({
    elapsedMs: 0,
    status: 'idle',
  });
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (state.status !== 'running' || startedAtRef.current === null) {
      return;
    }

    const updateElapsedTime = () => {
      const startedAt = startedAtRef.current;

      if (startedAt === null) {
        return;
      }

      setState((current) => ({
        ...current,
        elapsedMs: Math.max(0, Date.now() - startedAt),
      }));
    };

    updateElapsedTime();
    const interval = setInterval(updateElapsedTime, tickIntervalMs);

    return () => clearInterval(interval);
  }, [state.status]);

  const start = useCallback(() => {
    setState((current) => {
      if (current.status === 'running') {
        return current;
      }

      startedAtRef.current = Date.now() - current.elapsedMs;

      return { ...current, status: 'running' };
    });
  }, []);

  const pause = useCallback(() => {
    setState((current) => {
      if (current.status !== 'running' || startedAtRef.current === null) {
        return current;
      }

      const elapsedMs = Math.max(0, Date.now() - startedAtRef.current);
      startedAtRef.current = null;

      return { elapsedMs, status: 'paused' };
    });
  }, []);

  const reset = useCallback(() => {
    startedAtRef.current = null;
    setState({ elapsedMs: 0, status: 'idle' });
  }, []);

  return { ...state, pause, reset, start };
}

export function formatElapsedTime(elapsedMs: number): string {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
}
