import { getSupabaseClient } from '@/data/supabase/client';
import type { EntityId } from '@/domain';
import { ShowMutationError } from '@/data/supabase/showMutations';

export interface ShowBlockDraft {
  readonly id: EntityId;
  readonly isNew?: boolean;
  readonly name: string;
}

export interface CreateShowBlockInput {
  readonly name: string;
  readonly position: number;
  readonly showId: EntityId;
}

function normalizeBlockName(name: string) {
  const normalized = name.trim();
  if (!normalized || Array.from(normalized).length > 120) {
    throw new ShowMutationError(
      'invalid_show',
      'Informe um nome de bloco com até 120 caracteres.',
    );
  }
  return normalized;
}

function mapBlockError(
  error: { code?: string; message: string },
  action: string,
) {
  if (
    error.code === '42501' ||
    error.message.includes('JWT') ||
    error.message.includes('row-level security') ||
    error.message.includes('permission') ||
    error.message.includes('SHOW_NOT_EDITABLE')
  ) {
    return new ShowMutationError(
      'permission_denied',
      `Seu papel não permite ${action} blocos neste show.`,
    );
  }

  return new ShowMutationError(
    'request_failed',
    `Não foi possível ${action} o bloco agora. Tente novamente.`,
  );
}

export async function createShowBlock(
  input: CreateShowBlockInput,
): Promise<EntityId> {
  if (!Number.isSafeInteger(input.position) || input.position < 0) {
    throw new ShowMutationError(
      'invalid_show',
      'A posição do bloco precisa ser um número válido.',
    );
  }

  const { data, error } = await getSupabaseClient()
    .from('show_blocks')
    .insert({
      name: normalizeBlockName(input.name),
      position: input.position,
      show_id: input.showId,
    })
    .select('id')
    .single();

  if (error) throw mapBlockError(error, 'criar');
  if (!data || typeof data.id !== 'string' || data.id.length === 0) {
    throw new ShowMutationError(
      'request_failed',
      'O bloco não retornou um identificador válido. Tente novamente.',
    );
  }

  return data.id;
}

export async function renameShowBlock({
  blockId,
  name,
}: {
  readonly blockId: EntityId;
  readonly name: string;
}): Promise<void> {
  const { data, error } = await getSupabaseClient()
    .from('show_blocks')
    .update({ name: normalizeBlockName(name) })
    .eq('id', blockId)
    .select('id')
    .maybeSingle();

  if (error) throw mapBlockError(error, 'renomear');
  if (!data) {
    throw new ShowMutationError(
      'not_found_or_forbidden',
      'O bloco não existe mais ou você não tem permissão para alterá-lo.',
    );
  }
}

export async function reorderShowBlocks({
  blocks,
  showId,
}: {
  readonly blocks: readonly ShowBlockDraft[];
  readonly showId: EntityId;
}): Promise<void> {
  const ids = blocks.map(({ id }) => id);
  if (ids.length === 0 || new Set(ids).size !== ids.length) {
    throw new ShowMutationError(
      'invalid_show',
      'A lista de blocos precisa ter identificadores únicos.',
    );
  }

  const client = getSupabaseClient();
  const temporaryOffset = 1000000;

  try {
    for (const [index, block] of blocks.entries()) {
      const { error } = await client
        .from('show_blocks')
        .update({ position: temporaryOffset + index })
        .eq('id', block.id)
        .eq('show_id', showId);
      if (error) throw mapBlockError(error, 'reordenar');
    }

    for (const [index, block] of blocks.entries()) {
      const { error } = await client
        .from('show_blocks')
        .update({ position: index })
        .eq('id', block.id)
        .eq('show_id', showId);
      if (error) throw mapBlockError(error, 'reordenar');
    }
  } catch (error) {
    if (error instanceof ShowMutationError) throw error;
    throw new ShowMutationError(
      'request_failed',
      'Não foi possível reordenar os blocos agora. Tente novamente.',
    );
  }
}
