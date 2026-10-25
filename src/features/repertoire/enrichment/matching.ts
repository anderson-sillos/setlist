import type { EnrichmentCandidate } from './types';

export const MATCHING_DURATION_TOLERANCE_MS = 2_000;

export interface CandidateMatchContext {
  readonly title: string;
  readonly artist: string;
  readonly durationMs: number | null;
}

export interface RankedCandidateGroup {
  readonly candidate: EnrichmentCandidate;
  readonly equivalentRecordIds: readonly number[];
}

export type HasUsableSynchronizedLyrics = (
  candidate: EnrichmentCandidate,
) => boolean;

export function normalizeMatchText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function matchScore(query: string, candidate: string): number {
  const normalizedQuery = normalizeMatchText(query);
  const normalizedCandidate = normalizeMatchText(candidate);
  if (!normalizedQuery || !normalizedCandidate) return 3;
  if (normalizedQuery === normalizedCandidate) return 0;

  const queryWords = normalizedQuery.split(' ');
  const candidateWords = new Set(normalizedCandidate.split(' '));
  if (queryWords.every((word) => candidateWords.has(word))) return 1;
  if (
    normalizedCandidate.includes(normalizedQuery) ||
    normalizedQuery.includes(normalizedCandidate)
  ) {
    return 2;
  }
  return 3;
}

function lyricsSignature(candidate: EnrichmentCandidate): string {
  const normalizeLyrics = (value: string) =>
    value
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .map((line) => line.trim().replace(/\s+/g, ' '))
      .join('\n')
      .trim();
  const synchronized = candidate.syncedLyrics?.trim();
  if (synchronized) return `synced:${normalizeLyrics(synchronized)}`;
  const plain = candidate.plainLyrics?.trim();
  if (plain) return `plain:${normalizeLyrics(plain)}`;
  return 'without-lyrics';
}

function equivalentRecording(
  left: EnrichmentCandidate,
  right: EnrichmentCandidate,
): boolean {
  if (
    normalizeMatchText(left.title) !== normalizeMatchText(right.title) ||
    normalizeMatchText(left.artist) !== normalizeMatchText(right.artist) ||
    lyricsSignature(left) !== lyricsSignature(right)
  ) {
    return false;
  }

  if (left.durationMs === null || right.durationMs === null) {
    return left.durationMs === right.durationMs;
  }

  return (
    Math.abs(left.durationMs - right.durationMs) <=
    MATCHING_DURATION_TOLERANCE_MS
  );
}

function durationDifference(
  candidate: EnrichmentCandidate,
  durationMs: number | null,
): number {
  if (durationMs === null) return 0;
  if (candidate.durationMs === null) return Number.POSITIVE_INFINITY;
  return Math.abs(candidate.durationMs - durationMs);
}

function compareCandidates(
  left: EnrichmentCandidate,
  right: EnrichmentCandidate,
  context: CandidateMatchContext,
  hasUsableSyncedLyrics: HasUsableSynchronizedLyrics,
): number {
  const titleDifference =
    matchScore(context.title, left.title) -
    matchScore(context.title, right.title);
  if (titleDifference) return titleDifference;

  const artistDifference =
    matchScore(context.artist, left.artist) -
    matchScore(context.artist, right.artist);
  if (artistDifference) return artistDifference;

  const leftDurationDifference = durationDifference(left, context.durationMs);
  const rightDurationDifference = durationDifference(right, context.durationMs);
  if (leftDurationDifference < rightDurationDifference) return -1;
  if (leftDurationDifference > rightDurationDifference) return 1;

  const lyricsDifference =
    Number(hasUsableSyncedLyrics(right)) - Number(hasUsableSyncedLyrics(left));
  if (lyricsDifference) return lyricsDifference;

  return left.recordId - right.recordId;
}

/** Agrupa apenas gravações equivalentes e ordena por correspondência/duração. */
export function rankEnrichmentCandidates(
  candidates: readonly EnrichmentCandidate[],
  context: CandidateMatchContext,
  hasUsableSyncedLyrics: HasUsableSynchronizedLyrics = (candidate) =>
    Boolean(candidate.syncedLyrics?.trim()),
): readonly RankedCandidateGroup[] {
  const groups: EnrichmentCandidate[][] = [];

  for (const candidate of candidates) {
    const group = groups.find((items) =>
      items.some((item) => equivalentRecording(item, candidate)),
    );
    if (group) group.push(candidate);
    else groups.push([candidate]);
  }

  return groups
    .map((items) => {
      const ordered = [...items].sort((left, right) =>
        compareCandidates(left, right, context, hasUsableSyncedLyrics),
      );
      return {
        candidate: ordered[0]!,
        equivalentRecordIds: ordered
          .map((item) => item.recordId)
          .sort((a, b) => a - b),
      };
    })
    .sort((left, right) =>
      compareCandidates(
        left.candidate,
        right.candidate,
        context,
        hasUsableSyncedLyrics,
      ),
    );
}
