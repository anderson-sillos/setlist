import { getSupabaseClient } from '@/data/supabase/client';
import type {
  AppendRepertoireCollectionSongsInput,
  DeleteRepertoireCollectionInput,
  EntityId,
  RepertoireCollection,
  RepertoireCollectionErrorCode,
  RepertoireCollectionRepository,
  RepertoireCollectionSong,
  SaveRepertoireCollectionInput,
  SetSongRepertoireCollectionsInput,
} from '@/domain';
import { RepertoireCollectionError } from '@/domain';

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

function readPosition(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new Error('Resposta inválida do Supabase: position.');
  }
  return value;
}

function parseCollection(value: unknown): RepertoireCollection {
  if (!isRecord(value)) {
    throw new Error('Resposta inválida do Supabase: coleção.');
  }

  return {
    bandId: readString(value, 'band_id'),
    createdAt: readString(value, 'created_at'),
    id: readString(value, 'id'),
    name: readString(value, 'name'),
    updatedAt: readString(value, 'updated_at'),
  };
}

function parseMembership(value: unknown): RepertoireCollectionSong {
  if (!isRecord(value)) {
    throw new Error('Resposta inválida do Supabase: participação.');
  }

  return {
    bandId: readString(value, 'band_id'),
    collectionId: readString(value, 'collection_id'),
    position: readPosition(value.position),
    songId: readString(value, 'song_id'),
  };
}

function mapError(error: { code?: string; message: string }) {
  const message = error.message.toUpperCase();
  let code: RepertoireCollectionErrorCode = 'request_failed';
  let userMessage =
    'Não foi possível atualizar as coleções agora. Tente novamente.';

  if (message.includes('COLLECTION_NAME_INVALID')) {
    code = 'invalid_name';
    userMessage = 'Informe um nome de até 120 caracteres.';
  } else if (message.includes('REPERTOIRE_COLLECTIONS_BAND_NAME_KEY')) {
    code = 'duplicate_name';
    userMessage = 'Já existe uma coleção com esse nome nesta banda.';
  } else if (
    message.includes('COLLECTION_CHANGED') ||
    message.includes('COLLECTION_REVISION_INVALID')
  ) {
    code = 'stale_revision';
    userMessage =
      'A coleção foi alterada por outra pessoa. Saia da edição e reabra a coleção para conferir a versão atual.';
  } else if (message.includes('COLLECTION_NOT_FOUND')) {
    code = 'not_found';
    userMessage = 'A coleção não existe mais nesta banda.';
  } else if (message.includes('COLLECTION_SONG_UNAVAILABLE')) {
    code = 'unavailable_song';
    userMessage = 'Uma ou mais músicas não estão disponíveis neste repertório.';
  } else if (
    error.code === '42501' ||
    message.includes('AUTHENTICATION_REQUIRED') ||
    message.includes('COLLECTION_ROLE_REQUIRED') ||
    message.includes('ROW-LEVEL SECURITY') ||
    message.includes('JWT')
  ) {
    code = 'permission_denied';
    userMessage = 'Seu papel não permite alterar coleções desta banda.';
  } else if (message.includes('COLLECTION_SONG_DUPLICATE')) {
    code = 'invalid_input';
    userMessage = 'A seleção contém músicas repetidas.';
  } else if (
    message.includes('COLLECTION_SONGS_INVALID') ||
    message.includes('COLLECTION_REVISIONS_INVALID')
  ) {
    code = 'invalid_input';
    userMessage = 'Revise os itens e tente salvar novamente.';
  }

  return new RepertoireCollectionError(code, userMessage);
}

function mapRequest<T>(
  request: PromiseLike<{
    data: T;
    error: { code?: string; message: string } | null;
  }>,
) {
  return Promise.resolve(request).then(({ data, error }) => {
    if (error) {
      throw mapError(error);
    }
    return data;
  });
}

export class SupabaseRepertoireCollectionRepository implements RepertoireCollectionRepository {
  async listByBandId(
    bandId: EntityId,
  ): Promise<readonly RepertoireCollection[]> {
    const { data, error } = await getSupabaseClient()
      .from('repertoire_collections')
      .select('id, band_id, name, created_at, updated_at')
      .eq('band_id', bandId)
      .order('name', { ascending: true });

    if (error) {
      throw mapError(error);
    }
    return (data ?? []).map(parseCollection);
  }

  async listSongsByBandId(
    bandId: EntityId,
  ): Promise<readonly RepertoireCollectionSong[]> {
    const { data, error } = await getSupabaseClient()
      .from('repertoire_collection_songs')
      .select('band_id, collection_id, song_id, position')
      .eq('band_id', bandId)
      .order('collection_id', { ascending: true })
      .order('position', { ascending: true });

    if (error) {
      throw mapError(error);
    }
    return (data ?? []).map(parseMembership);
  }

  async findById(
    bandId: EntityId,
    collectionId: EntityId,
  ): Promise<RepertoireCollection | null> {
    const { data, error } = await getSupabaseClient()
      .from('repertoire_collections')
      .select('id, band_id, name, created_at, updated_at')
      .eq('band_id', bandId)
      .eq('id', collectionId)
      .maybeSingle();

    if (error) {
      throw mapError(error);
    }
    return data ? parseCollection(data) : null;
  }

  async save(
    input: SaveRepertoireCollectionInput,
  ): Promise<RepertoireCollection> {
    const { data, error } = await getSupabaseClient().rpc(
      'save_repertoire_collection',
      {
        p_band_id: input.bandId,
        p_collection_id: input.collectionId ?? null,
        p_expected_updated_at: input.expectedUpdatedAt ?? null,
        p_name: input.name,
        p_song_ids: [...input.orderedSongIds],
      },
    );

    if (error) {
      throw mapError(error);
    }
    if (typeof data !== 'string' || data.length === 0) {
      throw mapError({ message: 'Resposta inválida do Supabase.' });
    }

    const saved = await this.findById(input.bandId, data);
    if (!saved) {
      throw mapError({ message: 'COLLECTION_NOT_FOUND' });
    }
    return saved;
  }

  async appendSongs(
    input: AppendRepertoireCollectionSongsInput,
  ): Promise<RepertoireCollection> {
    const { data, error } = await getSupabaseClient().rpc(
      'append_repertoire_collection_songs',
      {
        p_band_id: input.bandId,
        p_collection_id: input.collectionId,
        p_song_ids: [...input.songIds],
      },
    );

    if (error) {
      throw mapError(error);
    }
    if (typeof data !== 'string' || data.length === 0) {
      throw mapError({ message: 'Resposta inválida do Supabase.' });
    }

    const saved = await this.findById(input.bandId, data);
    if (!saved) {
      throw mapError({ message: 'COLLECTION_NOT_FOUND' });
    }
    return saved;
  }

  async setSongCollections(
    input: SetSongRepertoireCollectionsInput,
  ): Promise<void> {
    await mapRequest(
      getSupabaseClient().rpc('set_song_repertoire_collections', {
        p_band_id: input.bandId,
        p_collection_ids: [...input.collectionIds],
        p_expected_revisions: input.expectedRevisions,
        p_song_id: input.songId,
      }),
    );
  }

  async delete(input: DeleteRepertoireCollectionInput): Promise<void> {
    await mapRequest(
      getSupabaseClient().rpc('delete_repertoire_collection', {
        p_band_id: input.bandId,
        p_collection_id: input.collectionId,
        p_expected_updated_at: input.expectedUpdatedAt,
      }),
    );
  }
}

export function createSupabaseRepertoireCollectionRepository(): RepertoireCollectionRepository {
  return new SupabaseRepertoireCollectionRepository();
}
