import { getSupabaseClient } from '@/data/supabase/client';

export type AccountDeletionErrorCode =
  | 'account_not_found'
  | 'authentication_required'
  | 'last_owner'
  | 'request_failed'
  | 'solo_band';

export class AccountDeletionError extends Error {
  readonly code: AccountDeletionErrorCode;

  constructor(code: AccountDeletionErrorCode, message: string) {
    super(message);
    this.name = 'AccountDeletionError';
    this.code = code;
  }
}

function mapSupabaseError(message: string): AccountDeletionError {
  switch (true) {
    case message.includes('AUTHENTICATION_REQUIRED'):
      return new AccountDeletionError(
        'authentication_required',
        'Sua sessão expirou. Entre novamente para continuar.',
      );
    case message.includes('ACCOUNT_LAST_OWNER_REQUIRED'):
      return new AccountDeletionError(
        'last_owner',
        'Promova outro Proprietário antes de excluir sua conta.',
      );
    case message.includes('ACCOUNT_SOLO_BAND_REQUIRED'):
      return new AccountDeletionError(
        'solo_band',
        'Exclua primeiro as bandas em que você é o único integrante.',
      );
    case message.includes('ACCOUNT_NOT_FOUND'):
      return new AccountDeletionError(
        'account_not_found',
        'Esta conta já foi removida. Entre novamente se precisar usar o app.',
      );
    default:
      return new AccountDeletionError(
        'request_failed',
        'Não foi possível excluir a conta agora. Tente novamente.',
      );
  }
}

export async function deleteAccount(): Promise<void> {
  const { error } = await getSupabaseClient().rpc('delete_account');

  if (error) {
    throw mapSupabaseError(error.message);
  }
}
