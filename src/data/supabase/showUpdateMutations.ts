import { getSupabaseClient } from '@/data/supabase/client';
import type { EntityId, ShowStatus } from '@/domain';
import { ShowMutationError } from '@/data/supabase/showMutations';

export interface UpdateShowInput {
  readonly bandId: EntityId;
  readonly name: string;
  readonly notes: string | null;
  readonly showId: EntityId;
  readonly startsAt: string;
  readonly venue: string;
}

function required(value: string, label: string, maxLength: number) {
  const normalized = value.trim();
  if (!normalized || Array.from(normalized).length > maxLength) {
    throw new ShowMutationError(
      'invalid_show',
      'Informe ' + label + ' com até ' + maxLength + ' caracteres.',
    );
  }
  return normalized;
}

function startsAt(value: string) {
  const normalized = value.trim();
  if (!normalized || Number.isNaN(Date.parse(normalized))) {
    throw new ShowMutationError(
      'invalid_show',
      'Informe uma data e horário válidos para o show.',
    );
  }
  return new Date(normalized).toISOString();
}

export async function updateShow(input: UpdateShowInput): Promise<void> {
  const { data, error } = await getSupabaseClient()
    .from('shows')
    .update({
      name: required(input.name, 'um nome de show', 200),
      notes: input.notes?.trim() || null,
      starts_at: startsAt(input.startsAt),
      venue: required(input.venue, 'um local', 240),
    })
    .eq('id', input.showId)
    .eq('band_id', input.bandId)
    .select('id, updated_at')
    .maybeSingle();

  if (error) {
    if (
      error.code === '42501' ||
      error.message.includes('JWT') ||
      error.message.includes('row-level security') ||
      error.message.includes('permission')
    ) {
      throw new ShowMutationError(
        'permission_denied',
        'Seu papel não permite editar shows nesta banda.',
      );
    }
    throw new ShowMutationError(
      'request_failed',
      'Não foi possível atualizar o show agora. Tente novamente.',
    );
  }

  if (!data) {
    throw new ShowMutationError(
      'not_found_or_forbidden',
      'O show não existe mais ou você não tem permissão para alterá-lo.',
    );
  }
}

export interface UpdateShowStatusInput {
  readonly bandId: EntityId;
  readonly currentStatus: ShowStatus;
  readonly showId: EntityId;
  readonly status: ShowStatus;
}

const allowedStatusTransitions: Record<ShowStatus, readonly ShowStatus[]> = {
  cancelled: ['cancelled', 'draft'],
  draft: ['draft', 'ready', 'cancelled'],
  ready: ['ready', 'draft', 'cancelled'],
};

export async function updateShowStatus(
  input: UpdateShowStatusInput,
): Promise<void> {
  if (!allowedStatusTransitions[input.currentStatus].includes(input.status)) {
    throw new ShowMutationError(
      'invalid_show',
      'Essa transição de status não está disponível para o show.',
    );
  }

  if (input.currentStatus === input.status) return;

  const { data, error } = await getSupabaseClient()
    .from('shows')
    .update({ status: input.status })
    .eq('id', input.showId)
    .eq('band_id', input.bandId)
    .select('id')
    .maybeSingle();

  if (error) {
    if (
      error.code === '42501' ||
      error.message.includes('JWT') ||
      error.message.includes('row-level security') ||
      error.message.includes('permission') ||
      error.message.includes('SHOW_NOT_EDITABLE')
    ) {
      throw new ShowMutationError(
        'permission_denied',
        'Seu papel não permite alterar o status deste show.',
      );
    }

    throw new ShowMutationError(
      'request_failed',
      'Não foi possível atualizar o status agora. Tente novamente.',
    );
  }

  if (!data) {
    throw new ShowMutationError(
      'not_found_or_forbidden',
      'O show não existe mais ou você não tem permissão para alterá-lo.',
    );
  }
}
