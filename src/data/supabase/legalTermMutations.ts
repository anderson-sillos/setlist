import type { EntityId } from '@/domain';

import { getSupabaseClient } from './client';

export type LegalTermMutationErrorCode =
  | 'authentication_required'
  | 'not_current'
  | 'permission_denied'
  | 'request_failed';

export class LegalTermMutationError extends Error {
  readonly code: LegalTermMutationErrorCode;

  constructor(code: LegalTermMutationErrorCode, message: string) {
    super(message);
    this.name = 'LegalTermMutationError';
    this.code = code;
  }
}

function mapLegalTermError(message: string): LegalTermMutationError {
  if (message.includes('AUTHENTICATION_REQUIRED')) {
    return new LegalTermMutationError(
      'authentication_required',
      'Sua sessão expirou. Entre novamente para aceitar o termo.',
    );
  }

  if (message.includes('TERM_VERSION_NOT_CURRENT')) {
    return new LegalTermMutationError(
      'not_current',
      'O termo foi atualizado. Atualize o aplicativo e tente novamente.',
    );
  }

  if (
    message.includes('LEGAL_TERM_ROLE_REQUIRED') ||
    message.includes('permission') ||
    message.includes('PERMISSION')
  ) {
    return new LegalTermMutationError(
      'permission_denied',
      'Seu papel não permite aceitar este termo para editar o repertório.',
    );
  }

  return new LegalTermMutationError(
    'request_failed',
    'Não foi possível registrar seu aceite agora. Tente novamente.',
  );
}

export async function getCurrentBandTermAcceptance({
  bandId,
  termVersion,
  userId,
}: {
  readonly bandId: EntityId;
  readonly termVersion: string;
  readonly userId: EntityId;
}): Promise<boolean> {
  const { data, error } = await getSupabaseClient()
    .from('legal_acceptances')
    .select('id')
    .eq('band_id', bandId)
    .eq('term_version', termVersion)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw mapLegalTermError(error.message);
  }

  return data !== null;
}

export async function acceptCurrentBandTerm({
  bandId,
  termVersion,
}: {
  readonly bandId: EntityId;
  readonly termVersion: string;
}): Promise<void> {
  const { error } = await getSupabaseClient().rpc('accept_current_band_term', {
    p_band_id: bandId,
    p_term_version: termVersion,
  });

  if (error) {
    throw mapLegalTermError(error.message);
  }
}
