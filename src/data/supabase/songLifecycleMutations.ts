import { getSupabaseClient } from '@/data/supabase/client';
import type { EntityId } from '@/domain';

export type SongLifecycleErrorCode =
  | 'authentication_required'
  | 'not_found'
  | 'permission_denied'
  | 'request_failed'
  | 'term_acceptance_required';

export type SongRemovalResult = 'archived' | 'deleted';

export class SongLifecycleMutationError extends Error {
  readonly code: SongLifecycleErrorCode;

  constructor(code: SongLifecycleErrorCode, message: string) {
    super(message);
    this.name = 'SongLifecycleMutationError';
    this.code = code;
  }
}

function mapSupabaseError(error: { code?: string; message: string }) {
  const message = error.message.toUpperCase();

  if (message.includes('AUTHENTICATION_REQUIRED') || message.includes('JWT')) {
    return new SongLifecycleMutationError(
      'authentication_required',
      'Sua sessão expirou. Entre novamente para atualizar a música.',
    );
  }

  if (message.includes('SONG_TERM_ACCEPTANCE_REQUIRED')) {
    return new SongLifecycleMutationError(
      'term_acceptance_required',
      'Aceite o termo vigente da banda antes de administrar esta música.',
    );
  }

  if (message.includes('SONG_NOT_FOUND')) {
    return new SongLifecycleMutationError(
      'not_found',
      'A música não existe mais ou não está disponível nesta banda.',
    );
  }

  if (
    message.includes('SONG_ROLE_REQUIRED') ||
    error.code === '42501' ||
    message.includes('ROW-LEVEL')
  ) {
    return new SongLifecycleMutationError(
      'permission_denied',
      'Seu papel não permite administrar músicas desta banda.',
    );
  }

  return new SongLifecycleMutationError(
    'request_failed',
    'Não foi possível atualizar o ciclo de vida da música agora. Tente novamente.',
  );
}

export async function archiveSong({
  bandId,
  songId,
}: {
  readonly bandId: EntityId;
  readonly songId: EntityId;
}): Promise<void> {
  const { error } = await getSupabaseClient().rpc('set_song_archived', {
    p_archived: true,
    p_band_id: bandId,
    p_song_id: songId,
  });

  if (error) {
    throw mapSupabaseError(error);
  }
}

export async function restoreSong({
  bandId,
  songId,
}: {
  readonly bandId: EntityId;
  readonly songId: EntityId;
}): Promise<void> {
  const { error } = await getSupabaseClient().rpc('set_song_archived', {
    p_archived: false,
    p_band_id: bandId,
    p_song_id: songId,
  });

  if (error) {
    throw mapSupabaseError(error);
  }
}

export async function removeSong({
  bandId,
  songId,
}: {
  readonly bandId: EntityId;
  readonly songId: EntityId;
}): Promise<SongRemovalResult> {
  const { data, error } = await getSupabaseClient().rpc('remove_song', {
    p_band_id: bandId,
    p_song_id: songId,
  });

  if (error) {
    throw mapSupabaseError(error);
  }

  if (data !== 'archived' && data !== 'deleted') {
    throw new SongLifecycleMutationError(
      'request_failed',
      'A música foi atualizada sem retornar um resultado válido.',
    );
  }

  return data;
}
