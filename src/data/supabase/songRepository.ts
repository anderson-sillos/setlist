import type {
  EntityId,
  LyricBlock,
  LyricDocument,
  LyricLine,
  LyricStatus,
  Song,
  SongListOptions,
  SongRepository,
} from '@/domain';
import { isDemoBandId } from '@/data/demo';
import { getSupabaseClient } from '@/data/supabase/client';

const lyricStatuses: readonly LyricStatus[] = [
  'missing',
  'static',
  'incomplete',
  'synchronized',
];

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

  return { blocks: value.blocks.map(parseLyricBlock) };
}

function parseSong(value: unknown): Song {
  if (!isRecord(value)) {
    throw new Error('Resposta inválida do Supabase: música.');
  }

  const lyricStatus = value.lyric_status;

  if (
    typeof lyricStatus !== 'string' ||
    !lyricStatuses.includes(lyricStatus as LyricStatus)
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
    lyricStatus: lyricStatus as LyricStatus,
    lyrics: parseLyrics(value.lyrics),
    musicalKey: readNullableString(value, 'musical_key'),
    notes: readNullableString(value, 'notes'),
    originalArtist: readNullableString(value, 'original_artist'),
    title: readString(value, 'title'),
    updatedAt: readString(value, 'updated_at'),
    youtubeReference: readNullableString(value, 'youtube_reference'),
  };
}

export class SupabaseSongRepository implements SongRepository {
  constructor(private readonly demoRepository?: SongRepository) {}

  async listByBandId(
    bandId: EntityId,
    options: SongListOptions = {},
  ): Promise<readonly Song[]> {
    if (isDemoBandId(bandId)) {
      return this.demoRepository?.listByBandId(bandId, options) ?? [];
    }

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

    if (songs.length > 0 || !this.demoRepository) {
      return songs;
    }

    return this.demoRepository.listByBandId(bandId, options);
  }

  async findById(bandId: EntityId, songId: EntityId): Promise<Song | null> {
    if (isDemoBandId(bandId)) {
      return this.demoRepository?.findById(bandId, songId) ?? null;
    }

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

    return this.demoRepository?.findById(bandId, songId) ?? null;
  }
}

export function createSupabaseSongRepository(
  demoRepository?: SongRepository,
): SongRepository {
  return new SupabaseSongRepository(demoRepository);
}
