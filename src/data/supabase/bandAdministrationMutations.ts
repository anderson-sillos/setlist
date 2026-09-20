import { getSupabaseClient } from '@/data/supabase/client';
import type { EntityId } from '@/domain';

export type BandAdministrationErrorCode =
  'band_name_invalid' | 'last_owner' | 'permission_denied' | 'request_failed';

export class BandAdministrationError extends Error {
  readonly code: BandAdministrationErrorCode;

  constructor(code: BandAdministrationErrorCode, message: string) {
    super(message);
    this.name = 'BandAdministrationError';
    this.code = code;
  }
}

function mapSupabaseError(message: string): BandAdministrationError {
  if (
    message.includes('BAND_MUST_BE_SOLO_OWNER') ||
    message.includes('LAST_OWNER')
  ) {
    return new BandAdministrationError(
      'last_owner',
      'A banda só pode ser excluída quando você for seu único integrante.',
    );
  }

  if (
    message.includes('BAND_OWNER_REQUIRED') ||
    message.includes('permission') ||
    message.includes('PERMISSION')
  ) {
    return new BandAdministrationError(
      'permission_denied',
      'Só um Proprietário pode administrar esta banda.',
    );
  }

  return new BandAdministrationError(
    'request_failed',
    'Não foi possível atualizar a banda agora. Tente novamente.',
  );
}

export async function updateBandName({
  bandId,
  name,
}: {
  readonly bandId: EntityId;
  readonly name: string;
}): Promise<void> {
  const normalizedName = name.trim();

  if (normalizedName.length === 0 || normalizedName.length > 120) {
    throw new BandAdministrationError(
      'band_name_invalid',
      'Informe um nome de banda com até 120 caracteres.',
    );
  }

  const { error } = await getSupabaseClient()
    .from('bands')
    .update({ name: normalizedName })
    .eq('id', bandId);

  if (error) {
    throw mapSupabaseError(error.message);
  }
}

export async function deleteBand(bandId: EntityId): Promise<void> {
  const { error } = await getSupabaseClient().rpc('delete_band', {
    p_band_id: bandId,
  });

  if (error) {
    throw mapSupabaseError(error.message);
  }
}
