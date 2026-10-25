import type {
  EntityId,
  LyricBlock,
  LyricDocument,
  LyricLine,
  LyricStatus,
  Song,
  SongListOptions,
  SongRepository,
  SongSummary,
} from '@/domain';
import { getSupabaseClient } from '@/data/supabase/client';
import { parseLyricSourceMetadata } from '@/domain/lyricSource';

const lyricStatuses: readonly LyricStatus[] = [
  'missing',
  'static',
  'incomplete',
  'synchronized',
  'instrumental',
];

const songSummaryColumns =
  'id, band_id, title, original_artist, musical_key, bpm, estimated_duration_ms, lyric_status, archived_at, created_at, updated_at';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(row: Record<string, unknown>, key: string): string {
  const value = row[key];

  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Resposta inválida do Supabase: ${key}.`);
  }

  return value;
}

function readNullableString(
  row: Record<string, unknown>,
  key: string,
): string | null {
  const value = row[key];

  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error(`Resposta inválida do Supabase: ${key}.`);
  }

  return value;
}

function readNullableNumber(
  row: Record<string, unknown>,
  key: string,
): number | null {
  const value = row[key];

  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    throw new Error(`Resposta inválida do Supabase: ${key}.`);
  }

  return value;
}

function readNullableDateTime(
  row: Record<string, unknown>,
  key: string,
): string | null {
  return readNullableString(row, key);
}

function parseLyricLine(value: unknown): LyricLine {
  if (!isRecord(value)) {
    throw new Error('Resposta inválida do Supabase: linha da letra.');
  }

  const startTimeMs = value.startTimeMs;
  const kind = value.kind;
  const bold = value.bold;

  if (
    startTimeMs !== null &&
    startTimeMs !== undefined &&
    (typeof startTimeMs !== 'number' || !Number.isSafeInteger(startTimeMs))
  ) {
    throw new Error('Resposta inválida do Supabase: startTimeMs.');
  }

  if (kind !== undefined && kind !== 'separator') {
    throw new Error('Resposta inválida do Supabase: kind.');
  }

  if (bold !== undefined && typeof bold !== 'boolean') {
    throw new Error('Resposta inválida do Supabase: bold.');
  }

  if (typeof value.text !== 'string') {
    throw new Error('Resposta inválida do Supabase: text.');
  }

  return {
    id: readString(value, 'id'),
    startTimeMs: (startTimeMs as number | null | undefined) ?? null,
    text: value.text,
    ...(kind === 'separator' ? { kind: 'separator' as const } : {}),
    ...(bold === true ? { bold: true } : {}),
  };
}

function parseLyricBlock(value: unknown): LyricBlock {
  if (!isRecord(value) || !Array.isArray(value.lines)) {
    throw new Error('Resposta inválida do Supabase: bloco da letra.');
  }

  const name = value.name;

  if (name !== null && name !== undefined && typeof name !== 'string') {
    throw new Error('Resposta inválida do Supabase: name.');
  }

  return {
    id: readString(value, 'id'),
    lines: value.lines.map(parseLyricLine),
    name: (name as string | null | undefined) ?? null,
  };
}

function parseLyrics(value: unknown): LyricDocument {
  if (!isRecord(value) || !Array.isArray(value.blocks)) {
    throw new Error('Resposta inválida do Supabase: lyrics.');
  }

  const source = parseLyricSourceMetadata(value.source);
  return {
    blocks: value.blocks.map(parseLyricBlock),
    ...(source ? { source } : {}),
  };
}

function parseSong(value: unknown): Song {
  if (!isRecord(value)) {
    throw new Error('Resposta inválida do Supabase: música.');
  }

  const storedLyricStatus = value.lyric_status;

  if (
    typeof storedLyricStatus !== 'string' ||
    !lyricStatuses.includes(storedLyricStatus as LyricStatus)
  ) {
    throw new Error('Resposta inválida do Supabase: lyric_status.');
  }

  const storedStatus = storedLyricStatus as LyricStatus;
  const parsedLyrics = parseLyrics(value.lyrics);
  const lyrics =
    storedStatus === 'instrumental'
      ? { ...parsedLyrics, isInstrumental: true }
      : parsedLyrics;

  return {
    archivedAt: readNullableDateTime(value, 'archived_at'),
    bandId: readString(value, 'band_id'),
    bpm: readNullableNumber(value, 'bpm'),
    createdAt: readString(value, 'created_at'),
    estimatedDurationMs: readNullableNumber(value, 'estimated_duration_ms'),
    id: readString(value, 'id'),
    lyricStatus: storedStatus,
    lyrics,
    musicalKey: readNullableString(value, 'musical_key'),
    notes: readNullableString(value, 'notes'),
    originalArtist: readNullableString(value, 'original_artist'),
    title: readString(value, 'title'),
    updatedAt: readString(value, 'updated_at'),
    youtubeReference: readNullableString(value, 'youtube_reference'),
  };
}

function parseSongSummary(value: unknown): SongSummary {
  if (!isRecord(value)) {
    throw new Error('Resposta inválida do Supabase: resumo da música.');
  }

  const storedLyricStatus = value.lyric_status;
  if (
    typeof storedLyricStatus !== 'string' ||
    !lyricStatuses.includes(storedLyricStatus as LyricStatus)
  ) {
    throw new Error('Resposta inválida do Supabase: lyric_status.');
  }
  return {
    archivedAt: readNullableDateTime(value, 'archived_at'),
    bandId: readString(value, 'band_id'),
    bpm: readNullableNumber(value, 'bpm'),
    createdAt: readString(value, 'created_at'),
    estimatedDurationMs: readNullableNumber(value, 'estimated_duration_ms'),
    id: readString(value, 'id'),
    lyricStatus: storedLyricStatus as LyricStatus,
    musicalKey: readNullableString(value, 'musical_key'),
    originalArtist: readNullableString(value, 'original_artist'),
    title: readString(value, 'title'),
    updatedAt: readString(value, 'updated_at'),
  };
}

export class SupabaseSongRepository implements SongRepository {
  async listSummariesByBandId(
    bandId: EntityId,
    options: SongListOptions = {},
  ): Promise<readonly SongSummary[]> {
    let query = getSupabaseClient()
      .from('songs')
      .select(songSummaryColumns)
      .eq('band_id', bandId);

    if (!options.includeArchived) {
      query = query.is('archived_at', null);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return (data ?? []).map(parseSongSummary);
  }

  async listDocumentsByIds(
    bandId: EntityId,
    songIds: readonly EntityId[],
  ): Promise<readonly Song[]> {
    const requestedIds = [...new Set(songIds)];
    if (requestedIds.length === 0) {
      return [];
    }

    const { data, error } = await getSupabaseClient()
      .from('songs')
      .select('*')
      .eq('band_id', bandId)
      .in('id', requestedIds);

    if (error) {
      throw error;
    }

    const requestedIdSet = new Set(requestedIds);
    return (data ?? [])
      .map(parseSong)
      .filter((song) => song.bandId === bandId && requestedIdSet.has(song.id));
  }

  async listByBandId(
    bandId: EntityId,
    options: SongListOptions = {},
  ): Promise<readonly Song[]> {
    let query = getSupabaseClient()
      .from('songs')
      .select('*')
      .eq('band_id', bandId);

    if (!options.includeArchived) {
      query = query.is('archived_at', null);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const songs = (data ?? []).map(parseSong);

    return songs;
  }

  async findById(bandId: EntityId, songId: EntityId): Promise<Song | null> {
    const { data, error } = await getSupabaseClient()
      .from('songs')
      .select('*')
      .eq('band_id', bandId)
      .eq('id', songId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return parseSong(data);
    }

    return null;
  }
}

export function createSupabaseSongRepository(): SongRepository {
  return new SupabaseSongRepository();
}
