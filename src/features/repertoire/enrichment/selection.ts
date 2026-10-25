import type { EnrichmentCandidate, EnrichmentDurationDecision } from './types';
import { MATCHING_DURATION_TOLERANCE_MS, normalizeMatchText } from './matching';
import type { RankedCandidateGroup } from './matching';

export type CandidateSelectionPlan =
  | { readonly kind: 'empty' }
  | {
      readonly kind: 'select';
      readonly groups: readonly RankedCandidateGroup[];
    }
  | { readonly kind: 'apply'; readonly candidate: EnrichmentCandidate };

export interface CandidateSelectionContext {
  readonly title: string;
  readonly artist: string;
  readonly durationMs: number | null;
  readonly hasExistingLyrics: boolean;
}

export type LyricsImportPlan =
  | { readonly kind: 'preserve-existing' }
  | { readonly kind: 'import-static' }
  | { readonly kind: 'synchronize'; readonly durationMs: number | null }
  | {
      readonly kind: 'choose-duration';
      readonly currentDurationMs: number;
      readonly recordingDurationMs: number;
    };

export interface ResolvedDurationChoice {
  readonly durationMs: number;
  readonly useSynchronizedLyrics: boolean;
}

export function planLyricsImport(
  currentDurationMs: number | null | undefined,
  recordingDurationMs: number | null,
  hasExistingLyrics: boolean,
  hasUsableSynchronizedLyrics: boolean,
): LyricsImportPlan {
  if (hasExistingLyrics) return { kind: 'preserve-existing' };

  if (currentDurationMs === undefined) return { kind: 'import-static' };

  if (
    !hasUsableSynchronizedLyrics ||
    recordingDurationMs === null ||
    !Number.isSafeInteger(recordingDurationMs) ||
    recordingDurationMs <= 0
  ) {
    return { kind: 'import-static' };
  }

  if (currentDurationMs === null) {
    return { kind: 'synchronize', durationMs: recordingDurationMs };
  }

  if (!Number.isSafeInteger(currentDurationMs) || currentDurationMs <= 0) {
    return { kind: 'import-static' };
  }

  if (
    Math.abs(currentDurationMs - recordingDurationMs) <=
    MATCHING_DURATION_TOLERANCE_MS
  ) {
    return { kind: 'synchronize', durationMs: currentDurationMs };
  }

  return {
    kind: 'choose-duration',
    currentDurationMs,
    recordingDurationMs,
  };
}

export function resolveDurationChoice(
  currentDurationMs: number,
  recordingDurationMs: number,
  decision: EnrichmentDurationDecision,
): ResolvedDurationChoice {
  if (decision === 'use-recording-duration-and-sync') {
    return { durationMs: recordingDurationMs, useSynchronizedLyrics: true };
  }

  return { durationMs: currentDurationMs, useSynchronizedLyrics: false };
}

/**
 * Auto-applies only a single exact title+artist match. Partial matches, a
 * missing artist, multiple recordings, or a pending duration decision stay
 * in the single selection popup.
 */
export function planCandidateSelection(
  groups: readonly RankedCandidateGroup[],
  context: CandidateSelectionContext,
  candidateNeedsDurationChoice: (
    candidate: EnrichmentCandidate,
  ) => boolean = () => false,
): CandidateSelectionPlan {
  if (groups.length === 0) return { kind: 'empty' };
  if (groups.length !== 1 || !context.artist.trim()) {
    return { kind: 'select', groups };
  }

  const candidate = groups[0]!.candidate;
  const exactTitle =
    normalizeMatchText(candidate.title) === normalizeMatchText(context.title);
  const exactArtist =
    normalizeMatchText(candidate.artist) === normalizeMatchText(context.artist);

  if (!exactTitle || !exactArtist || candidateNeedsDurationChoice(candidate)) {
    return { kind: 'select', groups };
  }

  return { kind: 'apply', candidate };
}
