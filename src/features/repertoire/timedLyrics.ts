import type { LyricDocument, LyricLine } from '@/domain';

export interface TimedLyricLine {
  readonly id: string;
  readonly blockId: string;
  readonly documentOrder: number;
  readonly startTimeMs: number;
  readonly text: string;
}

export interface TimedLyricGroup {
  readonly id: string;
  readonly documentOrder: number;
  readonly lines: readonly TimedLyricLine[];
  readonly startTimeMs: number;
}

export interface TimedLyricsProjection {
  readonly groups: readonly TimedLyricGroup[];
  readonly isValid: boolean;
  readonly lines: readonly TimedLyricLine[];
}

/**
 * A duration is usable for proportional navigation only when it is finite,
 * positive, and ends after the final known lyric start. The last verse's
 * timestamp marks its beginning, not the end of the song.
 */
export function getUsableLyricDurationMs(
  estimatedDurationMs: number | null,
  lastTimestampMs: number | null,
): number | null {
  if (
    estimatedDurationMs === null ||
    !Number.isFinite(estimatedDurationMs) ||
    estimatedDurationMs <= 0
  ) {
    return null;
  }

  if (
    lastTimestampMs !== null &&
    (!Number.isFinite(lastTimestampMs) ||
      estimatedDurationMs <= lastTimestampMs)
  ) {
    return null;
  }

  return estimatedDurationMs;
}

export function clampLyricPositionMs(
  positionMs: number,
  durationMs: number | null,
): number | null {
  if (!Number.isFinite(positionMs)) {
    return null;
  }

  const lowerBoundedPosition = Math.max(0, positionMs);

  return durationMs === null
    ? lowerBoundedPosition
    : Math.min(durationMs, lowerBoundedPosition);
}

export function getLyricProgressRatio(
  positionMs: number,
  durationMs: number | null,
): number | null {
  if (
    durationMs === null ||
    !Number.isFinite(durationMs) ||
    durationMs <= 0 ||
    !Number.isFinite(positionMs)
  ) {
    return null;
  }

  return Math.min(1, Math.max(0, positionMs / durationMs));
}

export function getLyricPositionFromTrackX(
  x: number,
  trackWidth: number,
  durationMs: number,
): number | null {
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(trackWidth) ||
    trackWidth <= 0 ||
    !Number.isFinite(durationMs) ||
    durationMs <= 0
  ) {
    return null;
  }

  const boundedX = Math.min(trackWidth, Math.max(0, x));
  return Math.round((boundedX / trackWidth) * durationMs);
}

export function projectTimedLyrics(
  document: LyricDocument,
): TimedLyricsProjection {
  const lines: TimedLyricLine[] = [];
  let documentOrder = 0;
  let previousStartTimeMs = -1;

  for (const block of document.blocks) {
    for (const line of block.lines) {
      if (line.kind === 'separator' || line.text.trim().length === 0) {
        continue;
      }

      const timedLine = toTimedLyricLine(block.id, line, documentOrder);
      documentOrder += 1;

      if (timedLine === null || timedLine.startTimeMs < previousStartTimeMs) {
        return { groups: [], isValid: false, lines: [] };
      }

      previousStartTimeMs = timedLine.startTimeMs;
      lines.push(timedLine);
    }
  }

  if (lines.length === 0) {
    return { groups: [], isValid: false, lines: [] };
  }

  const groups: TimedLyricGroup[] = [];

  for (const line of lines) {
    const currentGroup = groups.at(-1);

    if (currentGroup?.startTimeMs === line.startTimeMs) {
      groups[groups.length - 1] = {
        ...currentGroup,
        lines: [...currentGroup.lines, line],
      };
      continue;
    }

    groups.push({
      id: line.id,
      documentOrder: line.documentOrder,
      lines: [line],
      startTimeMs: line.startTimeMs,
    });
  }

  return { groups, isValid: true, lines };
}

export function getActiveTimedLyricGroup(
  groups: readonly TimedLyricGroup[],
  elapsedMs: number,
  durationMs: number | null,
): TimedLyricGroup | null {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
    return null;
  }

  if (durationMs !== null && elapsedMs >= durationMs) {
    return null;
  }

  let activeGroup: TimedLyricGroup | null = null;

  for (const group of groups) {
    if (group.startTimeMs > elapsedMs) {
      break;
    }

    activeGroup = group;
  }

  return activeGroup;
}

function toTimedLyricLine(
  blockId: string,
  line: LyricLine,
  documentOrder: number,
): TimedLyricLine | null {
  const startTimeMs = line.startTimeMs;

  if (
    startTimeMs === null ||
    !Number.isFinite(startTimeMs) ||
    startTimeMs < 0
  ) {
    return null;
  }

  return {
    id: line.id,
    blockId,
    documentOrder,
    startTimeMs,
    text: line.text,
  };
}
