import { getSupabaseClient } from '@/data/supabase/client';
import {
  deriveLyricStatus,
  type EntityId,
  type LyricBlock,
  type LyricDocument,
  type LyricLine,
} from '@/domain';
import { normalizeYoutubeReference } from '@/utils/youtubeReference';

export interface SongWriteInput {
  readonly bpm: number | null;
  readonly estimatedDurationMs: number | null;
  readonly musicalKey: string | null;
  readonly notes: string | null;
  readonly originalArtist: string | null;
  readonly title: string;
  readonly youtubeReference: string | null;
}

export type SongMutationErrorCode =
  | 'authentication_required'
  | 'invalid_song'
  | 'not_found_or_forbidden'
  | 'permission_denied'
  | 'request_failed';

export class SongMutationError extends Error {
  readonly code: SongMutationErrorCode;

  constructor(code: SongMutationErrorCode, message: string) {
    super(message);
    this.name = 'SongMutationError';
    this.code = code;
  }
}

function normalizeOptionalText(value: string | null): string | null {
  const normalized = value?.trim() ?? '';

  return normalized.length > 0 ? normalized : null;
}

function toDatabaseLyrics(document: LyricDocument) {
  if (!document || !Array.isArray(document.blocks)) {
    throw new SongMutationError(
      'invalid_song',
      'A letra contém um documento inválido. Confira os blocos e linhas.',
    );
  }

  const blockIds = new Set<string>();
  const lineIds = new Set<string>();
  const blocks = document.blocks.map((block: LyricBlock) => {
    if (
      !block ||
      typeof block.id !== 'string' ||
      !block.id.trim() ||
      blockIds.has(block.id) ||
      !Array.isArray(block.lines) ||
      (block.name !== null && typeof block.name !== 'string')
    ) {
      throw new SongMutationError(
        'invalid_song',
        'A letra contém um bloco inválido. Confira os nomes e a ordem.',
      );
    }

    blockIds.add(block.id);

    const lines = block.lines.map((line: LyricLine) => {
      if (
        !line ||
        typeof line.id !== 'string' ||
        !line.id.trim() ||
        lineIds.has(line.id) ||
        typeof line.text !== 'string' ||
        (line.kind !== undefined && line.kind !== 'separator') ||
        (line.bold !== undefined && typeof line.bold !== 'boolean') ||
        (line.startTimeMs !== null &&
          (!Number.isSafeInteger(line.startTimeMs) || line.startTimeMs < 0))
      ) {
        throw new SongMutationError(
          'invalid_song',
          'A letra contém uma linha inválida. Confira o texto e a ordem.',
        );
      }

      lineIds.add(line.id);

      return { ...line };
    });

    return { ...block, name: block.name?.trim() || null, lines };
  });
  const lyrics = { blocks };

  return { lyrics, lyric_status: deriveLyricStatus(lyrics) };
}

function toDatabaseInput(input: SongWriteInput) {
  const title = input.title.trim();

  if (!title || Array.from(title).length > 200) {
    throw new SongMutationError(
      'invalid_song',
      'Informe um título de música com até 200 caracteres.',
    );
  }

  if (
    input.bpm !== null &&
    (!Number.isInteger(input.bpm) || input.bpm < 1 || input.bpm > 1000)
  ) {
    throw new SongMutationError(
      'invalid_song',
      'O BPM precisa ser um número inteiro entre 1 e 1000.',
    );
  }

  if (
    input.estimatedDurationMs !== null &&
    (!Number.isSafeInteger(input.estimatedDurationMs) ||
      input.estimatedDurationMs < 0)
  ) {
    throw new SongMutationError(
      'invalid_song',
      'Informe uma duração válida em minutos e segundos.',
    );
  }

  const youtubeReference = normalizeYoutubeReference(input.youtubeReference);

  if (
    input.youtubeReference?.trim() &&
    (!youtubeReference || input.youtubeReference.trim().length > 2048)
  ) {
    throw new SongMutationError(
      'invalid_song',
      'Informe um link HTTPS válido do YouTube com até 2048 caracteres.',
    );
  }

  return {
    bpm: input.bpm,
    estimated_duration_ms: input.estimatedDurationMs,
    musical_key: normalizeOptionalText(input.musicalKey),
    notes: normalizeOptionalText(input.notes),
    original_artist: normalizeOptionalText(input.originalArtist),
    title,
    youtube_reference: youtubeReference,
  };
}

function mapSupabaseError(error: { code?: string; message: string }) {
  if (
    error.message.includes('JWT') ||
    error.message.includes('AUTHENTICATION_REQUIRED')
  ) {
    return new SongMutationError(
      'authentication_required',
      'Sua sessão expirou. Entre novamente para salvar a música.',
    );
  }

  if (
    error.code === '42501' ||
    error.message.toLowerCase().includes('row-level')
  ) {
    return new SongMutationError(
      'permission_denied',
      'Seu papel não permite alterar o repertório desta banda.',
    );
  }

  if (error.code?.startsWith('23')) {
    return new SongMutationError(
      'invalid_song',
      'Confira os dados da música e tente salvar novamente.',
    );
  }

  return new SongMutationError(
    'request_failed',
    'Não foi possível salvar a música agora. Tente novamente.',
  );
}

export async function createSong({
  bandId,
  lyrics,
  song,
}: {
  readonly bandId: EntityId;
  readonly lyrics?: LyricDocument;
  readonly song: SongWriteInput;
}): Promise<EntityId> {
  const input = toDatabaseInput(song);
  const lyricsInput = lyrics ? toDatabaseLyrics(lyrics) : {};
  const { data, error } = await getSupabaseClient()
    .from('songs')
    .insert({ band_id: bandId, ...input, ...lyricsInput })
    .select('id')
    .single();

  if (error) {
    throw mapSupabaseError(error);
  }

  if (
    typeof data !== 'object' ||
    data === null ||
    !('id' in data) ||
    typeof data.id !== 'string'
  ) {
    throw new SongMutationError(
      'request_failed',
      'A música foi salva sem retornar um identificador válido.',
    );
  }

  return data.id;
}

export async function updateSong({
  bandId,
  lyrics,
  song,
  songId,
}: {
  readonly bandId: EntityId;
  readonly lyrics?: LyricDocument;
  readonly song: SongWriteInput;
  readonly songId: EntityId;
}): Promise<void> {
  const input = toDatabaseInput(song);
  const lyricsInput = lyrics ? toDatabaseLyrics(lyrics) : {};
  const { data, error } = await getSupabaseClient()
    .from('songs')
    .update({ ...input, ...lyricsInput })
    .eq('band_id', bandId)
    .eq('id', songId)
    .select('id')
    .maybeSingle();

  if (error) {
    throw mapSupabaseError(error);
  }

  if (!data) {
    throw new SongMutationError(
      'not_found_or_forbidden',
      'A música não existe mais ou você não tem permissão para alterá-la.',
    );
  }
}
