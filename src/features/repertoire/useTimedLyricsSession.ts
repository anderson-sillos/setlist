import { useEffect, useMemo } from 'react';

import type { Song } from '@/domain';
import { useManualTimer } from '@/features/stage/useManualTimer';
import {
  clampLyricPositionMs,
  getActiveTimedLyricGroup,
  getUsableLyricDurationMs,
  projectTimedLyrics,
} from './timedLyrics';

export function useTimedLyricsSession(song: Song | null | undefined) {
  const timer = useManualTimer();
  const { reset } = timer;
  const projection = useMemo(
    () => (song ? projectTimedLyrics(song.lyrics) : null),
    [song],
  );
  const isEligible = Boolean(
    song &&
    song.lyricStatus === 'synchronized' &&
    song.lyrics.isInstrumental !== true &&
    projection?.isValid,
  );
  const durationMs = isEligible
    ? getUsableLyricDurationMs(
        song?.estimatedDurationMs ?? null,
        projection?.groups.at(-1)?.startTimeMs ?? null,
      )
    : null;
  const activeGroup = isEligible
    ? getActiveTimedLyricGroup(
        projection?.groups ?? [],
        timer.elapsedMs,
        durationMs,
      )
    : null;

  useEffect(() => {
    if (!isEligible) {
      reset();
    }
  }, [isEligible, reset]);

  const seekTo = (positionMs: number) => {
    if (!isEligible) {
      return;
    }

    const boundedPositionMs = clampLyricPositionMs(positionMs, durationMs);
    if (boundedPositionMs !== null) {
      timer.seekTo(boundedPositionMs);
    }
  };

  const seekBy = (deltaMs: number) => {
    if (Number.isFinite(deltaMs)) {
      seekTo(timer.elapsedMs + deltaMs);
    }
  };

  return {
    activeGroup,
    durationMs,
    elapsedMs: timer.elapsedMs,
    isEligible,
    pause: timer.pause,
    projection: isEligible ? projection : null,
    reset: timer.reset,
    seekBy,
    seekTo,
    start: timer.start,
    status: timer.status,
  };
}
