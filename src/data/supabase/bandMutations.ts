import { getSupabaseClient } from '@/data/supabase/client';

export type CreateBandInput = {
  readonly acceptedTerm: boolean;
  readonly name: string;
  readonly termVersion: string;
};

export type BandCreationErrorCode =
  | 'acceptance_required'
  | 'authentication_required'
  | 'band_name_invalid'
  | 'request_failed'
  | 'term_version_required';

export class BandCreationError extends Error {
  readonly code: BandCreationErrorCode;

  constructor(code: BandCreationErrorCode, message: string) {
    super(message);
    this.name = 'BandCreationError';
    this.code = code;
  }
}

function mapSupabaseError(message: string): BandCreationError {
  switch (true) {
    case message.includes('AUTHENTICATION_REQUIRED'):
      return new BandCreationError(
        'authentication_required',
        'Sua sessão expirou. Entre novamente para criar uma banda.',
      );
    case message.includes('BAND_NAME_INVALID'):
      return new BandCreationError(
        'band_name_invalid',
        'Informe um nome de banda com até 120 caracteres.',
      );
    case message.includes('TERM_VERSION_NOT_CURRENT'):
      return new BandCreationError(
        'term_version_required',
        'O termo vigente foi atualizado. Atualize o aplicativo e tente novamente.',
      );
    case message.includes('TERM_VERSION_REQUIRED'):
      return new BandCreationError(
        'term_version_required',
        'O termo vigente não está disponível. Tente novamente em instantes.',
      );
    default:
      return new BandCreationError(
        'request_failed',
        'Não foi possível criar a banda agora. Tente novamente.',
      );
  }
}

export async function createBand({
  acceptedTerm,
  name,
  termVersion,
}: CreateBandInput): Promise<string> {
  if (!acceptedTerm) {
    throw new BandCreationError(
      'acceptance_required',
      'Você precisa aceitar o termo para criar a banda.',
    );
  }

  const normalizedName = name.trim();
  const normalizedTermVersion = termVersion.trim();

  if (normalizedName.length === 0 || normalizedName.length > 120) {
    throw new BandCreationError(
      'band_name_invalid',
      'Informe um nome de banda com até 120 caracteres.',
    );
  }

  if (normalizedTermVersion.length === 0 || normalizedTermVersion.length > 64) {
    throw new BandCreationError(
      'term_version_required',
      'O termo vigente não está disponível. Tente novamente em instantes.',
    );
  }

  const { data, error } = await getSupabaseClient().rpc('create_band', {
    p_accepted: acceptedTerm,
    p_name: normalizedName,
    p_term_version: normalizedTermVersion,
  });

  if (error) {
    throw mapSupabaseError(error.message);
  }

  if (typeof data !== 'string' || data.length === 0) {
    throw new BandCreationError(
      'request_failed',
      'A banda não retornou um identificador válido. Tente novamente.',
    );
  }

  return data;
}
