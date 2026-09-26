import { getSupabaseClient } from '@/data/supabase/client';
import type { EntityId, ShowSetlistItem } from '@/domain';
import { ShowMutationError } from '@/data/supabase/showMutations';

function mapItemsError(
  error: { code?: string; message: string },
  action: string,
) {
  if (
    error.code === '42501' ||
    error.message.includes('JWT') ||
    error.message.includes('row-level security') ||
    error.message.includes('permission') ||
    error.message.includes('SHOW_NOT_EDITABLE') ||
    error.message.includes('SONG_BAND_MISMATCH')
  ) {
    return new ShowMutationError(
      'permission_denied',
      'Seu papel não permite ' + action + ' itens neste show.',
    );
  }

  return new ShowMutationError(
    'request_failed',
    'Não foi possível ' + action + ' os itens do show agora. Tente novamente.',
  );
}

function normalizeDuration(value: number | null) {
  if (value === null) return null;
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new ShowMutationError(
      'invalid_show',
      'A duração do planejamento precisa ser um número válido.',
    );
  }
  return value;
}

function itemPayload(
  blockId: EntityId,
  item: ShowSetlistItem,
  position: number,
) {
  if (item.type === 'song') {
    return {
      block_id: blockId,
      item_type: 'song' as const,
      notes: item.notes?.trim() || null,
      position,
      song_id: item.songId,
    };
  }

  if (item.type === 'planning') {
    const description = item.description.trim();
    if (!description || Array.from(description).length > 240) {
      throw new ShowMutationError(
        'invalid_show',
        'Informe uma anotação de planejamento com até 240 caracteres.',
      );
    }

    return {
      block_id: blockId,
      description,
      estimated_duration_ms: normalizeDuration(item.estimatedDurationMs),
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

export async function replaceShowBlockItems({
  blockId,
  items,
}: {
  readonly blockId: EntityId;
  readonly items: readonly ShowSetlistItem[];
}): Promise<void> {
  const client = getSupabaseClient();
  const { error: deleteError } = await client
    .from('show_items')
    .delete()
    .eq('block_id', blockId);

  if (deleteError) {
    throw mapItemsError(deleteError, 'remover');
  }

  if (items.length === 0) return;

  const payload = items.map((item, position) =>
    itemPayload(blockId, item, position),
  );
  const { error: insertError } = await client
    .from('show_items')
    .insert(payload);

  if (insertError) {
    throw mapItemsError(insertError, 'salvar');
  }
}
