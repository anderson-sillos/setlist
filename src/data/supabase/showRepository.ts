import type {
  EntityId,
  Show,
  ShowRepository,
  ShowSetlistBlock,
  ShowSetlistItem,
  ShowStatus,
} from '@/domain';
import { getSupabaseClient } from '@/data/supabase/client';

const showStatuses: readonly ShowStatus[] = ['draft', 'ready', 'cancelled'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
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

function parseItem(value: unknown): ShowSetlistItem {
  if (!isRecord(value)) {
    throw new Error('Resposta inválida do Supabase: item do setlist.');
  }

  const type = value.item_type;
  const id = readString(value, 'id');

  if (type === 'song') {
    return {
      id,
      notes: readNullableString(value, 'notes'),
      songId: readString(value, 'song_id'),
      type: 'song',
    };
  }

  if (type === 'planning') {
    return {
      description: readString(value, 'description'),
      estimatedDurationMs: readNullableNumber(value, 'estimated_duration_ms'),
      id,
      type: 'planning',
    };
  }

  if (type === 'separator') {
    return { id, type: 'separator' };
  }

  throw new Error('Resposta inválida do Supabase: item_type.');
}

function readPosition(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    throw new Error('Resposta inválida do Supabase: position.');
  }

  return value;
}

function parseBlock(value: unknown): {
  readonly block: ShowSetlistBlock;
  readonly position: number;
} {
  if (!isRecord(value) || !Array.isArray(value.show_items)) {
    throw new Error('Resposta inválida do Supabase: bloco do setlist.');
  }

  const items = value.show_items
    .map((item) => {
      if (!isRecord(item)) {
        throw new Error('Resposta inválida do Supabase: item do setlist.');
      }

      return { item: parseItem(item), position: readPosition(item.position) };
    })
    .sort((left, right) => left.position - right.position)
    .map(({ item }) => item);

  return {
    block: {
      id: readString(value, 'id'),
      items,
      name: readString(value, 'name'),
    },
    position: readPosition(value.position),
  };
}

function parseShow(value: unknown): Show {
  if (!isRecord(value) || !Array.isArray(value.show_blocks)) {
    throw new Error('Resposta inválida do Supabase: show.');
  }

  const status = value.status;

  if (
    typeof status !== 'string' ||
    !showStatuses.includes(status as ShowStatus)
  ) {
    throw new Error('Resposta inválida do Supabase: status.');
  }

  const blocks = value.show_blocks
    .map(parseBlock)
    .sort((left, right) => left.position - right.position)
    .map(({ block }) => block);

  return {
    bandId: readString(value, 'band_id'),
    blocks,
    createdAt: readString(value, 'created_at'),
    id: readString(value, 'id'),
    name: readString(value, 'name'),
    notes: readNullableString(value, 'notes'),
    startsAt: readString(value, 'starts_at'),
    status: status as ShowStatus,
    updatedAt: readString(value, 'updated_at'),
    venue: readString(value, 'venue'),
  };
}

const showSelect =
  'id, band_id, name, starts_at, venue, notes, status, created_at, updated_at, show_blocks(id, name, position, show_items(id, position, item_type, song_id, description, estimated_duration_ms, notes))';

export class SupabaseShowRepository implements ShowRepository {
  async listByBandId(bandId: EntityId): Promise<readonly Show[]> {
    const { data, error } = await getSupabaseClient()
      .from('shows')
      .select(showSelect)
      .eq('band_id', bandId)
      .order('starts_at', { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map(parseShow);
  }

  async findById(bandId: EntityId, showId: EntityId): Promise<Show | null> {
    const { data, error } = await getSupabaseClient()
      .from('shows')
      .select(showSelect)
      .eq('band_id', bandId)
      .eq('id', showId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? parseShow(data) : null;
  }
}

export function createSupabaseShowRepository(): ShowRepository {
  return new SupabaseShowRepository();
}
