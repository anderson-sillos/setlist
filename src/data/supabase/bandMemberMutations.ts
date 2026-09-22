import { getSupabaseClient } from '@/data/supabase/client';
import type { BandRole, EntityId } from '@/domain';

export type UpdateBandMemberRoleInput = {
  readonly bandId: EntityId;
  readonly memberId: EntityId;
  readonly role: BandRole;
};

export type RemoveBandMemberInput = {
  readonly bandId: EntityId;
  readonly memberId: EntityId;
};

export type LeaveBandInput = {
  readonly bandId: EntityId;
};

export type BandMemberMutationErrorCode =
  'last_owner' | 'permission_denied' | 'request_failed';

export class BandMemberMutationError extends Error {
  readonly code: BandMemberMutationErrorCode;

  constructor(code: BandMemberMutationErrorCode, message: string) {
    super(message);
    this.name = 'BandMemberMutationError';
    this.code = code;
  }
}

function mapSupabaseError(message: string): BandMemberMutationError {
  if (
    message.includes('last owner') ||
    message.includes('LAST_OWNER') ||
    message.includes('último Owner')
  ) {
    return new BandMemberMutationError(
      'last_owner',
      'Promova outro Proprietário antes de remover ou rebaixar esta pessoa.',
    );
  }

  if (
    message.includes('permission') ||
    message.includes('PERMISSION') ||
    message.includes('not authorized')
  ) {
    return new BandMemberMutationError(
      'permission_denied',
      'Só um Proprietário pode administrar integrantes desta banda.',
    );
  }

  return new BandMemberMutationError(
    'request_failed',
    'Não foi possível atualizar os integrantes agora. Tente novamente.',
  );
}

export async function updateBandMemberRole({
  bandId,
  memberId,
  role,
}: UpdateBandMemberRoleInput): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('band_members')
    .update({ role })
    .eq('band_id', bandId)
    .eq('id', memberId);

  if (error) {
    throw mapSupabaseError(error.message);
  }
}

export async function removeBandMember({
  bandId,
  memberId,
}: RemoveBandMemberInput): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('band_members')
    .delete()
    .eq('band_id', bandId)
    .eq('id', memberId);

  if (error) {
    throw mapSupabaseError(error.message);
  }
}

export async function leaveBand({ bandId }: LeaveBandInput): Promise<void> {
  const { error } = await getSupabaseClient().rpc('leave_band', {
    p_band_id: bandId,
  });

  if (error) {
    throw mapSupabaseError(error.message);
  }
}
