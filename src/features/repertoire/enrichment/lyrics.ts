import * as ExpoCrypto from 'expo-crypto';

import type { LyricBlock, LyricDocument, LyricLine } from '@/domain';

export interface EnrichmentLyricsInput {
  readonly plainLyrics: string | null;
  readonly syncedLyrics: string | null;
  readonly recordingDurationMs: number | null;
}

export interface EnrichmentLyricsResult {
  readonly synchronizedDocument: LyricDocument | null;
  readonly staticDocument: LyricDocument | null;
  readonly hasText: boolean;
  readonly synchronized: boolean;
}

interface TimedLine {
  readonly text: string;
  readonly timeMs: number;
  readonly stanza: number;
  readonly order: number;
}

const timestampPattern = /\[(\d{2,}):(\d{2})(?:\.(\d{1,3}))?\]/g;
const offsetPattern = /^\[offset:([+-]?\d+)\]\s*$/i;
const metadataPattern =
  /^\[(?:ar|ti|al|au|by|re|ve|length|kana|la|tool):.*\]\s*$/i;
const minimumStanzaPauseMs = 8_000;
const stanzaPauseMultiplier = 2.5;
const minimumPositiveIntervals = 3;

function parseTimestamp(
  minutesText: string,
  secondsText: string,
  fractionText: string | undefined,
): number | null {
  const minutes = Number(minutesText);
  const seconds = Number(secondsText);
  if (!Number.isSafeInteger(minutes) || seconds < 0 || seconds > 59) {
    return null;
  }
  const fraction = fractionText ? Number(fractionText.padEnd(3, '0')) : 0;
  const milliseconds = (minutes * 60 + seconds) * 1000 + fraction;
  return Number.isSafeInteger(milliseconds) ? milliseconds : null;
}

function normalizeText(value: string): string {
  return value.replace(/\r\n?/g, '\n');
}

function buildStaticDocument(
  text: string,
  createId: () => string,
): LyricDocument | null {
  const blocks: LyricBlock[] = [];
  let lines: LyricLine[] = [];

  const pushBlock = () => {
    if (lines.length === 0) return;
    blocks.push({ id: createId(), name: null, lines });
    lines = [];
  };

  for (const rawLine of normalizeText(text).split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      pushBlock();
      continue;
    }
    lines.push({ id: createId(), text: line, startTimeMs: null });
  }
  pushBlock();

  return blocks.length > 0 ? { blocks } : null;
}

function extractTextFromLrc(value: string): string {
  return normalizeText(value)
    .split('\n')
    .filter((line) => !offsetPattern.test(line.trim()))
    .filter((line) => !metadataPattern.test(line.trim()))
    .map((line) => line.replace(timestampPattern, '').trim())
    .join('\n');
}

function normalizeLineForAlignment(text: string): string {
  return text.normalize('NFC').trim().replace(/\s+/gu, ' ').toLowerCase();
}

function findStanzaBreaks(
  entries: readonly TimedLine[],
  lines: readonly TimedLine[],
  plainLyrics: string,
): ReadonlySet<number> {
  const breaks = new Set<number>();
  let previousStanza: number | null = null;
  let timedBreakPending = false;

  for (const entry of entries) {
    if (!entry.text) {
      timedBreakPending = true;
      continue;
    }
    if (
      previousStanza !== null &&
      (entry.stanza !== previousStanza || timedBreakPending)
    ) {
      breaks.add(entry.order);
    }
    previousStanza = entry.stanza;
    timedBreakPending = false;
  }

  const plainLines: { text: string; stanza: number }[] = [];
  let plainStanza = 0;
  for (const rawLine of normalizeText(plainLyrics).split('\n')) {
    const text = normalizeLineForAlignment(rawLine);
    if (text) plainLines.push({ text, stanza: plainStanza });
    else plainStanza += 1;
  }

  // Reuse paragraphs only when the full text matches the chronological LRC.
  if (
    plainLines.length === lines.length &&
    plainLines.every(
      (line, index) =>
        line.text === normalizeLineForAlignment(lines[index]!.text),
    )
  ) {
    for (let index = 1; index < lines.length; index += 1) {
      if (plainLines[index]!.stanza !== plainLines[index - 1]!.stanza) {
        breaks.add(lines[index]!.order);
      }
    }
  }

  // Source paragraphs take precedence over the timing heuristic.
  if (breaks.size > 0) return breaks;

  const intervals = lines
    .slice(1)
    .map((line, index) => line.timeMs - lines[index]!.timeMs)
    .filter((interval) => interval > 0)
    .sort((left, right) => left - right);
  if (intervals.length < minimumPositiveIntervals) return breaks;

  const middle = Math.floor(intervals.length / 2);
  const typicalInterval =
    intervals.length % 2 === 0
      ? (intervals[middle - 1]! + intervals[middle]!) / 2
      : intervals[middle]!;
  const pauseThreshold = Math.max(
    minimumStanzaPauseMs,
    typicalInterval * stanzaPauseMultiplier,
  );

  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index]!.timeMs - lines[index - 1]!.timeMs >= pauseThreshold) {
      breaks.add(lines[index]!.order);
    }
  }
  return breaks;
}

function parseLrc(
  value: string,
  recordingDurationMs: number | null,
  plainLyrics: string,
  createId: () => string,
): { readonly document: LyricDocument | null; readonly valid: boolean } {
  const rawLines = normalizeText(value).split('\n');
  let offsetMs = 0;

  for (const rawLine of rawLines) {
    const offsetMatch = rawLine.trim().match(offsetPattern);
    if (offsetMatch) {
      const parsedOffset = Number(offsetMatch[1]);
      if (!Number.isSafeInteger(parsedOffset)) {
        return { document: null, valid: false };
      }
      offsetMs = parsedOffset;
    }
  }

  const timedLines: TimedLine[] = [];
  let stanza = 0;
  let order = 0;
  let hasUntimedText = false;
  let hasMalformedTimestamp = false;

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      stanza += 1;
      continue;
    }
    if (offsetPattern.test(trimmed) || metadataPattern.test(trimmed)) continue;

    const timestamps: number[] = [];
    const text = rawLine
      .replace(timestampPattern, (_match, minute, second, fraction) => {
        const parsed = parseTimestamp(minute, second, fraction);
        if (parsed === null) hasMalformedTimestamp = true;
        else timestamps.push(parsed + offsetMs);
        return '';
      })
      .trim();

    if (timestamps.length === 0) {
      if (text) hasUntimedText = true;
      continue;
    }
    for (const timeMs of timestamps) {
      timedLines.push({ text, timeMs, stanza, order });
      order += 1;
    }
  }

  const sortedEntries = [...timedLines].sort(
    (left, right) => left.timeMs - right.timeMs || left.order - right.order,
  );
  const sortedLines = sortedEntries.filter(({ text }) => text.length > 0);
  const hasText = sortedLines.length > 0;
  const durationIsValid =
    recordingDurationMs !== null &&
    Number.isSafeInteger(recordingDurationMs) &&
    recordingDurationMs > 0;
  const timesAreValid =
    durationIsValid &&
    sortedLines.every(
      ({ timeMs }) =>
        Number.isSafeInteger(timeMs) &&
        timeMs >= 0 &&
        timeMs <= recordingDurationMs! + 2_000,
    );
  const valid =
    hasText &&
    sortedLines.length > 0 &&
    !hasUntimedText &&
    !hasMalformedTimestamp &&
    timesAreValid;

  if (!valid) return { document: null, valid: false };

  const stanzaBreaks = findStanzaBreaks(
    sortedEntries,
    sortedLines,
    plainLyrics,
  );
  const blocks: LyricBlock[] = [];
  let currentLines: LyricLine[] = [];

  const pushBlock = () => {
    if (currentLines.length === 0) return;
    blocks.push({ id: createId(), name: null, lines: currentLines });
    currentLines = [];
  };

  for (const line of sortedLines) {
    if (stanzaBreaks.has(line.order)) pushBlock();
    currentLines.push({
      id: createId(),
      text: line.text,
      startTimeMs: line.timeMs,
    });
  }
  pushBlock();

  return { document: { blocks }, valid: true };
}

/** Converts external plain/LRC text into fresh local lyric documents. */
export function convertEnrichmentLyrics(
  input: EnrichmentLyricsInput,
  createId: () => string = () => ExpoCrypto.randomUUID(),
): EnrichmentLyricsResult {
  const plainText = input.plainLyrics?.trim() ?? '';
  const syncedText = input.syncedLyrics?.trim() ?? '';
  const lrc = syncedText
    ? parseLrc(syncedText, input.recordingDurationMs, plainText, createId)
    : { document: null, valid: false };

  if (lrc.valid && lrc.document) {
    const staticText =
      plainText || (syncedText ? extractTextFromLrc(syncedText) : '');
    return {
      synchronizedDocument: lrc.document,
      staticDocument: buildStaticDocument(staticText, createId),
      hasText: true,
      synchronized: true,
    };
  }

  const staticText =
    plainText || (syncedText ? extractTextFromLrc(syncedText) : '');
  const staticDocument = buildStaticDocument(staticText, createId);

  return {
    synchronizedDocument: null,
    staticDocument,
    hasText: staticDocument !== null,
    synchronized: false,
  };
}
