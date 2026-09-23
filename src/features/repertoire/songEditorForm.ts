import type { Song } from '@/domain';
import type { SongWriteInput } from '@/data/supabase/songMutations';
import { formatDuration } from '@/utils/duration';
import { normalizeYoutubeReference } from '@/utils/youtubeReference';

export interface SongEditorValues {
  readonly bpm: string;
  readonly duration: string;
  readonly musicalKey: string;
  readonly notes: string;
  readonly originalArtist: string;
  readonly title: string;
  readonly youtubeReference: string;
}

export type SongEditorField = keyof SongEditorValues;

export type SongEditorErrors = Partial<Record<SongEditorField, string>>;

export interface DurationParts {
  readonly hours: string;
  readonly minutes: string;
  readonly seconds: string;
}

export type SongEditorParseResult =
  | { readonly errors: SongEditorErrors; readonly song: SongWriteInput }
  | { readonly errors: SongEditorErrors; readonly song: null };

export const emptySongEditorValues: SongEditorValues = {
  bpm: '',
  duration: '',
  musicalKey: '',
  notes: '',
  originalArtist: '',
  title: '',
  youtubeReference: '',
};

export function durationToParts(value: string): DurationParts {
  const parts = value.trim().split(':');

  if (!value.trim()) {
    return { hours: '', minutes: '', seconds: '' };
  }

  if (parts.length === 3) {
    return {
      hours: parts[0] ?? '',
      minutes: parts[1] ?? '',
      seconds: parts[2] ?? '',
    };
  }

  if (parts.length === 2) {
    return {
      hours: '',
      minutes: parts[0] ?? '',
      seconds: parts[1] ?? '',
    };
  }

  return { hours: '', minutes: parts[0] ?? '', seconds: '' };
}

export function durationFromParts(parts: DurationParts): string {
  const hours = parts.hours.trim();
  const minutes = parts.minutes.trim();
  const seconds = parts.seconds.trim();

  if (!hours && !minutes && !seconds) {
    return '';
  }

  const normalizedMinutes = minutes || '0';
  const normalizedSeconds = seconds || '0';

  if (hours) {
    return `${hours}:${normalizedMinutes.padStart(2, '0')}:${normalizedSeconds.padStart(2, '0')}`;
  }

  return `${normalizedMinutes}:${normalizedSeconds.padStart(2, '0')}`;
}

/**
 * Recompõe a duração enquanto o usuário ainda está editando os campos
 * separados, preservando um único dígito para que o próximo possa ser
 * digitado sem estourar o maxLength do input.
 */
export function durationFromEditorParts(parts: DurationParts): string {
  const hours = parts.hours.trim();
  const minutes = parts.minutes.trim();
  const seconds = parts.seconds.trim();

  if (!hours && !minutes && !seconds) {
    return '';
  }

  const normalizedMinutes = minutes || '0';
  const normalizedSeconds = seconds || '0';

  if (hours) {
    return `${hours}:${normalizedMinutes}:${normalizedSeconds}`;
  }

  return `${normalizedMinutes}:${normalizedSeconds}`;
}

export function songToEditorValues(song: Song): SongEditorValues {
  return {
    bpm: song.bpm === null ? '' : String(song.bpm),
    duration:
      song.estimatedDurationMs === null
        ? ''
        : formatDuration(song.estimatedDurationMs),
    musicalKey: song.musicalKey ?? '',
    notes: song.notes ?? '',
    originalArtist: song.originalArtist ?? '',
    title: song.title,
    youtubeReference: song.youtubeReference ?? '',
  };
}

function parseDuration(value: string): number | null | undefined {
  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  const parts = normalized.split(':');

  if (
    (parts.length !== 2 && parts.length !== 3) ||
    parts.some((part) => !/^\d+$/.test(part))
  ) {
    return undefined;
  }

  const numbers = parts.map(Number);
  const seconds = numbers.at(-1) ?? 0;
  const minutes = parts.length === 3 ? (numbers[1] ?? 0) : (numbers[0] ?? 0);
  const hours = parts.length === 3 ? (numbers[0] ?? 0) : 0;

  if (seconds > 59 || (parts.length === 3 && minutes > 59)) {
    return undefined;
  }

  const durationMs = (hours * 3600 + minutes * 60 + seconds) * 1000;

  return Number.isSafeInteger(durationMs) ? durationMs : undefined;
}

export function parseSongEditorValues(
  values: SongEditorValues,
): SongEditorParseResult {
  const title = values.title.trim();
  const bpmText = values.bpm.trim();
  const durationMs = parseDuration(values.duration);
  const youtubeText = values.youtubeReference.trim();
  const youtubeReference = normalizeYoutubeReference(youtubeText);
  const errors: SongEditorErrors = {};

  if (!title) {
    errors.title = 'Informe o título da música.';
  } else if (title.length > 200) {
    errors.title = 'O título pode ter até 200 caracteres.';
  }

  if (bpmText && !/^\d+$/.test(bpmText)) {
    errors.bpm = 'Informe o BPM como número inteiro.';
  } else if (bpmText && (Number(bpmText) < 1 || Number(bpmText) > 1000)) {
    errors.bpm = 'Use um BPM entre 1 e 1000.';
  }

  if (durationMs === undefined) {
    errors.duration =
      'Informe uma duração válida em horas, minutos e segundos.';
  }

  if (youtubeText && (!youtubeReference || youtubeText.length > 2048)) {
    errors.youtubeReference = 'Informe um link HTTPS válido do YouTube.';
  }

  if (Object.keys(errors).length > 0) {
    return { errors, song: null };
  }

  return {
    errors,
    song: {
      bpm: bpmText ? Number(bpmText) : null,
      estimatedDurationMs: durationMs ?? null,
      musicalKey: values.musicalKey.trim() || null,
      notes: values.notes.trim() || null,
      originalArtist: values.originalArtist.trim() || null,
      title,
      youtubeReference,
    },
  };
}
