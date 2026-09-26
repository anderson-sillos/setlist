import { getSupabaseClient } from '@/data/supabase/client';
import type { EntityId, Show } from '@/domain';

export interface CreateShowInput {
  readonly bandId: EntityId;
  readonly name: string;
  readonly notes: string | null;
  readonly startsAt: string;
  readonly venue: string;
}

export interface DuplicateShowInput {
  readonly bandId: EntityId;
  readonly name: string;
  readonly notes: string | null;
  readonly show: Show;
  readonly startsAt: string;
  readonly venue: string;
}

export type ShowMutationErrorCode =
  | 'invalid_show'
  | 'not_found_or_forbidden'
  | 'permission_denied'
  | 'request_failed';

export class ShowMutationError extends Error {
  readonly code: ShowMutationErrorCode;
  constructor(code: ShowMutationErrorCode, message: string) {
    super(message);
    this.name = 'ShowMutationError';
    this.code = code;
  }
}

function normalizeRequired(value: string, label: string, maxLength: number) {
  const normalized = value.trim();
  if (!normalized || Array.from(normalized).length > maxLength) {
    throw new ShowMutationError(
      'invalid_show',
      `Informe ${label} com até ${maxLength} caracteres.`,
    );
  }
  return normalized;
}

function normalizeStartsAt(value: string) {
  const normalized = value.trim();
  if (!normalized || Number.isNaN(Date.parse(normalized))) {
    throw new ShowMutationError(
      'invalid_show',
      'Informe uma data e horário válidos para o show.',
    );
  }
  return new Date(normalized).toISOString();
}

function mapError(
  error: { code?: string; message: string },
  action: 'criar' | 'duplicar' | 'excluir',
) {
  if (
    error.code === '42501' ||
    error.message.includes('JWT') ||
    error.message.includes('row-level security') ||
    error.message.includes('permission') ||
    error.message.includes('SHOW_DELETE_FORBIDDEN')
  ) {
    return new ShowMutationError(
      'permission_denied',
      `Seu papel não permite ${action} shows nesta banda.`,
    );
  }
  return new ShowMutationError(
    'request_failed',
    `Não foi possível ${action} o show agora. Tente novamente.`,
  );
}

export async function createShow(input: CreateShowInput): Promise<EntityId> {
  const name = normalizeRequired(input.name, 'um nome de show', 200);
  const venue = normalizeRequired(input.venue, 'um local', 240);
  const startsAt = normalizeStartsAt(input.startsAt);
  const notes = input.notes?.trim() || null;
  const { data, error } = await getSupabaseClient()
    .from('shows')
    .insert({ band_id: input.bandId, name, notes, starts_at: startsAt, venue })
    .select('id')
    .single();
  if (error) throw mapError(error, 'criar');
  if (!data || typeof data.id !== 'string' || data.id.length === 0) {
    throw new ShowMutationError(
      'request_failed',
      'O show não retornou um identificador válido. Tente novamente.',
    );
  }
  const { error: blockError } = await getSupabaseClient()
    .from('show_blocks')
    .insert({ name: 'Principal', position: 0, show_id: data.id });
  if (blockError) {
    await getSupabaseClient().from('shows').delete().eq('id', data.id);
    throw mapError(blockError, 'criar');
  }
  return data.id;
}

function duplicateItemPayload(
  blockId: EntityId,
  item: Show['blocks'][number]['items'][number],
  position: number,
) {
  if (item.type === 'song') {
    return {
      block_id: blockId,
      item_type: 'song' as const,
      notes: item.notes,
      position,
      song_id: item.songId,
    };
  }

  if (item.type === 'planning') {
    return {
      block_id: blockId,
      description: item.description,
      estimated_duration_ms: item.estimatedDurationMs,
      item_type: 'planning' as const,
      position,
    };
  }

  return {
    block_id: blockId,
    item_type: 'separator' as const,
    position,
  };
}

export async function duplicateShow(
  input: DuplicateShowInput,
): Promise<EntityId> {
  if (input.show.bandId !== input.bandId) {
    throw new ShowMutationError(
      'not_found_or_forbidden',
      'O show não existe mais ou você não tem permissão para duplicá-lo.',
    );
  }

  const name = normalizeRequired(input.name, 'um nome de show', 200);
  const venue = normalizeRequired(input.venue, 'um local', 240);
  const startsAt = normalizeStartsAt(input.startsAt);
  const notes = input.notes?.trim() || null;
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('shows')
    .insert({ band_id: input.bandId, name, notes, starts_at: startsAt, venue })
    .select('id')
    .single();

  if (error) throw mapError(error, 'duplicar');
  if (!data || typeof data.id !== 'string' || data.id.length === 0) {
    throw new ShowMutationError(
      'request_failed',
      'O show duplicado não retornou um identificador válido. Tente novamente.',
    );
  }

  const rollback = async () => {
    await client.from('shows').delete().eq('id', data.id);
  };

  for (const [blockPosition, block] of input.show.blocks.entries()) {
    const blockResult = await client
      .from('show_blocks')
      .insert({ name: block.name, position: blockPosition, show_id: data.id })
      .select('id')
      .single();

    if (blockResult.error) {
      await rollback();
      throw mapError(blockResult.error, 'duplicar');
    }

    if (
      !blockResult.data ||
      typeof blockResult.data.id !== 'string' ||
      blockResult.data.id.length === 0
    ) {
      await rollback();
      throw new ShowMutationError(
        'request_failed',
        'O bloco duplicado não retornou um identificador válido. Tente novamente.',
      );
    }

    const items = block.items.map((item, position) =>
      duplicateItemPayload(blockResult.data.id, item, position),
    );

    if (items.length === 0) continue;

    const itemsResult = await client.from('show_items').insert(items);
    if (itemsResult.error) {
      await rollback();
      throw mapError(itemsResult.error, 'duplicar');
    }
  }

  return data.id;
}

export async function deleteShow({
  bandId,
  showId,
}: {
  readonly bandId: EntityId;
  readonly showId: EntityId;
}): Promise<void> {
  if (!bandId.trim() || !showId.trim()) {
    throw new ShowMutationError(
      'invalid_show',
      'Não foi possível identificar o show para exclusão.',
    );
  }

  const { error } = await getSupabaseClient().rpc('delete_show', {
    p_band_id: bandId,
    p_show_id: showId,
  });

  if (error) {
    if (error.message.includes('SHOW_NOT_FOUND')) {
      throw new ShowMutationError(
        'not_found_or_forbidden',
        'O show não existe mais ou não está disponível para exclusão.',
      );
    }
    throw mapError(error, 'excluir');
  }
}
