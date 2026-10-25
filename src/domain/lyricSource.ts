import type { LyricSourceMetadata } from './entities';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNullableText(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isValidDuration(value: unknown): value is number | null {
  return (
    value === null ||
    (typeof value === 'number' && Number.isSafeInteger(value) && value > 0)
  );
}

/** Invalid or unknown optional provenance is ignored without rejecting lyrics. */
export function parseLyricSourceMetadata(
  value: unknown,
): LyricSourceMetadata | undefined {
  if (!isRecord(value)) return undefined;
  if (
    value.provider !== 'lrclib' ||
    typeof value.recordId !== 'number' ||
    !Number.isSafeInteger(value.recordId) ||
    value.recordId <= 0 ||
    typeof value.title !== 'string' ||
    !value.title.trim() ||
    typeof value.artist !== 'string' ||
    !value.artist.trim() ||
    !isNullableText(value.album) ||
    !isValidDuration(value.recordingDurationMs) ||
    typeof value.importedAt !== 'string' ||
    !Number.isFinite(Date.parse(value.importedAt)) ||
    (value.format !== 'lrc' && value.format !== 'plain')
  ) {
    return undefined;
  }

  return {
    provider: 'lrclib',
    recordId: value.recordId,
    title: value.title,
    artist: value.artist,
    album: value.album,
    recordingDurationMs: value.recordingDurationMs,
    importedAt: value.importedAt,
    format: value.format,
  };
}
