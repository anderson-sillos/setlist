import type { TimedLyricGroup } from './timedLyrics';

export interface LyricLineBounds {
  readonly height: number;
  readonly top: number;
}

export interface LyricGroupBounds {
  readonly height: number;
  readonly top: number;
}

export function getLyricScrollBehavior(reducedMotion: boolean): ScrollBehavior {
  return reducedMotion ? 'auto' : 'smooth';
}

export function getLyricGroupBounds(
  group: TimedLyricGroup,
  lineBoundsById: ReadonlyMap<string, LyricLineBounds>,
): LyricGroupBounds | null {
  let top = Number.POSITIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;

  for (const line of group.lines) {
    const bounds = lineBoundsById.get(line.id);
    if (
      !bounds ||
      !Number.isFinite(bounds.top) ||
      !Number.isFinite(bounds.height) ||
      bounds.height < 0
    ) {
      continue;
    }

    top = Math.min(top, bounds.top);
    bottom = Math.max(bottom, bounds.top + bounds.height);
  }

  if (!Number.isFinite(top) || !Number.isFinite(bottom)) {
    return null;
  }

  return { height: bottom - top, top };
}

export function getCenteredLyricScrollOffset(
  bounds: LyricGroupBounds,
  viewportHeight: number,
  oversizedMargin = 16,
): number | null {
  if (
    !Number.isFinite(bounds.top) ||
    !Number.isFinite(bounds.height) ||
    bounds.height < 0 ||
    !Number.isFinite(viewportHeight) ||
    viewportHeight <= 0
  ) {
    return null;
  }

  if (bounds.height > viewportHeight) {
    return Math.max(0, bounds.top - Math.max(0, oversizedMargin));
  }

  return Math.max(0, bounds.top + bounds.height / 2 - viewportHeight / 2);
}

export function getLyricsEdgeSpacer(viewportHeight: number): number {
  return Number.isFinite(viewportHeight) && viewportHeight > 0
    ? viewportHeight / 2
    : 0;
}

export function getLyricFollowTargetGroup(
  groups: readonly TimedLyricGroup[],
  elapsedMs: number,
  durationMs: number | null,
): TimedLyricGroup | null {
  if (groups.length === 0 || !Number.isFinite(elapsedMs) || elapsedMs < 0) {
    return null;
  }

  if (durationMs !== null && elapsedMs >= durationMs) {
    return groups.at(-1) ?? null;
  }

  let target = groups[0]!;
  for (const group of groups) {
    if (group.startTimeMs > elapsedMs) {
      break;
    }
    target = group;
  }
  return target;
}
