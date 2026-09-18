import type { Show, ShowSetlistBlock, Song } from '@/domain/entities';

export interface SetlistDurationBreakdown {
  readonly hasDuration: boolean;
  readonly musicMs: number;
  readonly planningMs: number;
  readonly totalMs: number | null;
}

export function getShowDurationMs(
  show: Show,
  songsById: ReadonlyMap<string, Song>,
): number | null {
  return getShowDurationBreakdown(show, songsById).totalMs;
}

export function getBlockDurationBreakdown(
  block: ShowSetlistBlock,
  songsById: ReadonlyMap<string, Song>,
): SetlistDurationBreakdown {
  let hasDuration = false;
  let musicMs = 0;
  let planningMs = 0;

  block.items.forEach((item) => {
    const duration =
      item.type === 'song'
        ? songsById.get(item.songId)?.estimatedDurationMs
        : item.type === 'planning'
          ? item.estimatedDurationMs
          : null;

    if (duration !== null && duration !== undefined) {
      hasDuration = true;

      if (item.type === 'planning') {
        planningMs += duration;
      } else {
        musicMs += duration;
      }
    }
  });

  return {
    hasDuration,
    musicMs,
    planningMs,
    totalMs: hasDuration ? musicMs + planningMs : null,
  };
}

export function getShowDurationBreakdown(
  show: Show,
  songsById: ReadonlyMap<string, Song>,
): SetlistDurationBreakdown {
  let hasDuration = false;
  let musicMs = 0;
  let planningMs = 0;

  show.blocks.forEach((block) => {
    const blockDuration = getBlockDurationBreakdown(block, songsById);
    hasDuration ||= blockDuration.hasDuration;
    musicMs += blockDuration.musicMs;
    planningMs += blockDuration.planningMs;
  });

  return {
    hasDuration,
    musicMs,
    planningMs,
    totalMs: hasDuration ? musicMs + planningMs : null,
  };
}
