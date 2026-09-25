import { getSupabaseClient } from '@/data/supabase/client';
import type { EntityId } from '@/domain';

export interface CreateShowInput {
  readonly bandId: EntityId;
  readonly name: string;
  readonly notes: string | null;
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

function mapError(error: { code?: string; message: string }) {
  if (
    error.code === '42501' ||
    error.message.includes('JWT') ||
    error.message.includes('row-level security') ||
    error.message.includes('permission')
  ) {
    return new ShowMutationError(
      'permission_denied',
      'Seu papel não permite criar shows nesta banda.',
    );
  }
  return new ShowMutationError(
    'request_failed',
    'Não foi possível criar o show agora. Tente novamente.',
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
  if (error) throw mapError(error);
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
    throw mapError(blockError);
  }
  return data.id;
}
