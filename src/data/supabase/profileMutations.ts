import { getSupabaseClient } from '@/data/supabase/client';
import type { EntityId } from '@/domain';

export interface UserProfile {
  readonly avatarUrl: string | null;
  readonly displayName: string | null;
  readonly email: string | null;
  readonly userId: EntityId;
}

export type ProfileErrorCode =
  'authentication_required' | 'invalid_display_name' | 'request_failed';

export class ProfileMutationError extends Error {
  readonly code: ProfileErrorCode;

  constructor(code: ProfileErrorCode, message: string) {
    super(message);
    this.name = 'ProfileMutationError';
    this.code = code;
  }
}

function mapProfileError(message: string): ProfileMutationError {
  if (message.includes('AUTHENTICATION_REQUIRED')) {
    return new ProfileMutationError(
      'authentication_required',
      'Sua sessão expirou. Entre novamente para atualizar seu perfil.',
    );
  }

  if (message.includes('PROFILE_DISPLAY_NAME_INVALID')) {
    return new ProfileMutationError(
      'invalid_display_name',
      'Use um nome de 1 a 120 caracteres.',
    );
  }

  return new ProfileMutationError(
    'request_failed',
    'Não foi possível atualizar seu nome agora. Tente novamente.',
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
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

export async function getUserProfile(
  userId: EntityId,
): Promise<UserProfile | null> {
  const { data, error } = await getSupabaseClient()
    .from('profiles')
    .select('id, display_name, email, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  if (!isRecord(data) || typeof data.id !== 'string') {
    throw new Error('Resposta inválida do Supabase: perfil.');
  }

  return {
    avatarUrl: readNullableString(data, 'avatar_url'),
    displayName: readNullableString(data, 'display_name'),
    email: readNullableString(data, 'email'),
    userId: data.id,
  };
}

export async function updateMyDisplayName(
  displayName: string,
): Promise<string> {
  const normalizedName = displayName.trim();

  if (!normalizedName || Array.from(normalizedName).length > 120) {
    throw mapProfileError('PROFILE_DISPLAY_NAME_INVALID');
  }

  const { data, error } = await getSupabaseClient().rpc(
    'update_my_display_name',
    { p_display_name: normalizedName },
  );

  if (error) {
    throw mapProfileError(error.message);
  }

  if (typeof data !== 'string') {
    throw mapProfileError('unexpected response');
  }

  return data;
}
