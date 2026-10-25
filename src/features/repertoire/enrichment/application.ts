import type { LyricDocument, LyricSourceMetadata } from '@/domain';
import { formatDuration } from '@/utils/duration';
import {
  parseDurationInput,
  type SongEditorValues,
} from '@/features/repertoire/songEditorForm';

import { planLyricsImport, resolveDurationChoice } from './selection';
import { formatEnrichmentName } from './nameFormatting';
import type { EnrichmentCandidate, EnrichmentDurationDecision } from './types';
import type { EnrichmentLyricsResult } from './lyrics';

export type EnrichmentChangedField = 'title' | 'artist' | 'duration' | 'lyrics';

export type EnrichmentApplicationResult =
  | {
      readonly kind: 'duration-choice-required';
      readonly currentDurationMs: number;
      readonly recordingDurationMs: number;
    }
  | { readonly kind: 'nothing-to-fill' }
  | {
      readonly kind: 'applied';
      readonly values: SongEditorValues;
      readonly lyrics: LyricDocument;
      readonly changedFields: readonly EnrichmentChangedField[];
      readonly lyricFormat: 'lrc' | 'plain' | 'instrumental' | null;
    };

export interface ApplyEnrichmentInput {
  readonly candidate: EnrichmentCandidate;
  readonly currentValues: SongEditorValues;
  readonly currentLyrics: LyricDocument;
  readonly convertedLyrics: EnrichmentLyricsResult;
  readonly importedAt: string;
  readonly durationDecision?: EnrichmentDurationDecision;
}

function hasText(document: LyricDocument): boolean {
  return document.blocks.some((block) =>
    block.lines.some((line) => line.text.trim().length > 0),
  );
}

function validDuration(value: number | null): value is number {
  return value !== null && Number.isSafeInteger(value) && value > 0;
}

function sourceMetadata(
  candidate: EnrichmentCandidate,
  importedAt: string,
  format: 'lrc' | 'plain',
): LyricSourceMetadata {
  return {
    provider: 'lrclib',
    recordId: candidate.recordId,
    title: candidate.title,
    artist: candidate.artist,
    album: candidate.album,
    recordingDurationMs: candidate.durationMs,
    importedAt,
    format,
  };
}

/** Applies only eligible fields to the current local draft; it never saves. */
export function applyEnrichmentToDraft(
  input: ApplyEnrichmentInput,
): EnrichmentApplicationResult {
  const { candidate, currentValues, currentLyrics, convertedLyrics } = input;
  const candidateIsInstrumental = candidate.instrumental === true;
  const lyricsAlreadyPresent =
    hasText(currentLyrics) || currentLyrics.isInstrumental === true;
  const parsedDuration = currentValues.duration.trim()
    ? parseDurationInput(currentValues.duration)
    : null;
  const durationPlan = planLyricsImport(
    parsedDuration,
    candidate.durationMs,
    lyricsAlreadyPresent,
    !candidateIsInstrumental && convertedLyrics.synchronizedDocument !== null,
  );

  if (
    durationPlan.kind === 'choose-duration' &&
    input.durationDecision === undefined
  ) {
    return {
      kind: 'duration-choice-required',
      currentDurationMs: durationPlan.currentDurationMs,
      recordingDurationMs: durationPlan.recordingDurationMs,
    };
  }

  let values = currentValues;
  let lyrics = currentLyrics;
  const changedFields: EnrichmentChangedField[] = [];
  let lyricFormat: 'lrc' | 'plain' | 'instrumental' | null = null;

  const candidateTitle = formatEnrichmentName(candidate.title);
  if (candidateTitle && candidateTitle !== currentValues.title) {
    values = { ...values, title: candidateTitle };
    changedFields.push('title');
  }

  const candidateArtist = formatEnrichmentName(candidate.artist);
  if (candidateArtist && candidateArtist !== currentValues.originalArtist) {
    values = { ...values, originalArtist: candidateArtist };
    changedFields.push('artist');
  }

  const durationIsBlank = !currentValues.duration.trim();
  if (durationIsBlank && validDuration(candidate.durationMs)) {
    values = { ...values, duration: formatDuration(candidate.durationMs) };
    changedFields.push('duration');
  }

  let documentToImport: LyricDocument | null = null;
  if (!candidateIsInstrumental && durationPlan.kind === 'synchronize') {
    documentToImport = convertedLyrics.synchronizedDocument;
    lyricFormat = documentToImport ? 'lrc' : null;
  } else if (
    !candidateIsInstrumental &&
    durationPlan.kind === 'import-static'
  ) {
    documentToImport = convertedLyrics.staticDocument;
    lyricFormat = documentToImport ? 'plain' : null;
  } else if (
    !candidateIsInstrumental &&
    durationPlan.kind === 'choose-duration'
  ) {
    const decision = resolveDurationChoice(
      durationPlan.currentDurationMs,
      durationPlan.recordingDurationMs,
      input.durationDecision!,
    );

    if (decision.useSynchronizedLyrics) {
      documentToImport = convertedLyrics.synchronizedDocument;
      values = {
        ...values,
        duration: formatDuration(decision.durationMs),
      };
      if (!changedFields.includes('duration')) changedFields.push('duration');
      lyricFormat = documentToImport ? 'lrc' : null;
    } else {
      documentToImport = convertedLyrics.staticDocument;
      lyricFormat = documentToImport ? 'plain' : null;
    }
  }

  if (!lyricsAlreadyPresent && documentToImport && hasText(documentToImport)) {
    lyrics = {
      ...documentToImport,
      source: sourceMetadata(candidate, input.importedAt, lyricFormat!),
    };
    changedFields.push('lyrics');
  }

  if (candidateIsInstrumental && !lyricsAlreadyPresent) {
    lyrics = { ...currentLyrics, isInstrumental: true };
    changedFields.push('lyrics');
    lyricFormat = 'instrumental';
  }

  if (changedFields.length === 0) return { kind: 'nothing-to-fill' };

  return { kind: 'applied', values, lyrics, changedFields, lyricFormat };
}
