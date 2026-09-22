import * as ExpoCrypto from 'expo-crypto';

import type { BandInvitation, EntityId, InvitationStatus } from '@/domain';
import { getShareableInviteUrl } from '@/features/auth/authLinks';

import { getSupabaseClient } from './client';

type InvitationRow = {
  readonly band_id: string;
  readonly created_at: string;
  readonly expires_at: string;
  readonly id: string;
  readonly label: string | null;
  readonly revoked_at: string | null;
  readonly used_at: string | null;
};

export type CreateInvitationInput = {
  readonly bandId: EntityId;
  readonly label?: string;
  readonly expiresAt?: string;
};

export type InvitationPreview = {
  readonly alreadyAccepted: boolean;
  readonly bandId: EntityId;
  readonly bandName: string;
  readonly label: string | null;
  readonly expiresAt: string;
};

export type CreatedInvitation = {
  readonly id: EntityId;
  readonly token: string;
  readonly url: string;
};

export type InvitationMutationErrorCode =
  'invalid' | 'not_available' | 'permission_denied' | 'request_failed';

export class InvitationMutationError extends Error {
  readonly code: InvitationMutationErrorCode;

  constructor(code: InvitationMutationErrorCode, message: string) {
    super(message);
    this.name = 'InvitationMutationError';
    this.code = code;
  }
}

function mapInvitationError(message: string): InvitationMutationError {
  if (
    message.includes('INVITATION_NOT_AVAILABLE') ||
    message.includes('not available')
  ) {
    return new InvitationMutationError(
      'not_available',
      'Esse convite não está mais disponível. Gere outro para seguir o show.',
    );
  }

  if (
    message.includes('permission') ||
    message.includes('PERMISSION') ||
    message.includes('not authorized')
  ) {
    return new InvitationMutationError(
      'permission_denied',
      'Só um Proprietário pode administrar os convites desta banda.',
    );
  }

  if (
    message.includes('INVITATION_LABEL_INVALID') ||
    message.includes('INVITATION_EXPIRY_INVALID') ||
    message.includes('INVITATION_TOKEN_INVALID')
  ) {
    return new InvitationMutationError(
      'invalid',
      'Confira os dados do convite e tente novamente.',
    );
  }

  return new InvitationMutationError(
    'request_failed',
    'Não foi possível atualizar os convites agora. Tente novamente.',
  );
}

function parseInvitation(row: unknown): InvitationRow {
  if (!row || typeof row !== 'object') {
    throw new Error('Resposta inválida do Supabase: convite.');
  }

  const value = row as Record<string, unknown>;
  const requiredStrings = ['band_id', 'created_at', 'expires_at', 'id'];

  for (const key of requiredStrings) {
    if (typeof value[key] !== 'string' || value[key].length === 0) {
      throw new Error(`Resposta inválida do Supabase: ${key}.`);
    }
  }

  for (const key of ['label', 'revoked_at', 'used_at']) {
    if (
      value[key] !== null &&
      value[key] !== undefined &&
      typeof value[key] !== 'string'
    ) {
      throw new Error(`Resposta inválida do Supabase: ${key}.`);
    }
  }

  return {
    band_id: value.band_id as string,
    created_at: value.created_at as string,
    expires_at: value.expires_at as string,
    id: value.id as string,
    label: (value.label as string | null | undefined) ?? null,
    revoked_at: (value.revoked_at as string | null | undefined) ?? null,
    used_at: (value.used_at as string | null | undefined) ?? null,
  };
}

function getInvitationStatus(row: InvitationRow): InvitationStatus {
  if (row.revoked_at) {
    return 'revoked';
  }

  if (row.used_at) {
    return 'used';
  }

  return new Date(row.expires_at).getTime() <= Date.now()
    ? 'expired'
    : 'active';
}

function toInvitation(row: InvitationRow): BandInvitation {
  return {
    bandId: row.band_id,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    id: row.id,
    label: row.label,
    revokedAt: row.revoked_at,
    status: getInvitationStatus(row),
    usedAt: row.used_at,
  };
}

function normalizeLabel(label?: string): string | null {
  const normalized = label?.trim() ?? '';

  return normalized.length > 0 ? normalized : null;
}

function generateInvitationToken(): string {
  // randomUUID fornece 122 bits aleatórios e o valor bruto só permanece em
  // memória para ser compartilhado; o banco recebe apenas seu hash.
  return ExpoCrypto.randomUUID();
}

export async function listInvitations(
  bandId: EntityId,
): Promise<readonly BandInvitation[]> {
  const { data, error } = await getSupabaseClient()
    .from('invitations')
    .select('id, band_id, label, created_at, expires_at, revoked_at, used_at')
    .eq('band_id', bandId)
    .order('created_at', { ascending: false });

  if (error) {
    throw mapInvitationError(error.message);
  }

  return (data ?? []).map(parseInvitation).map(toInvitation);
}

export async function createInvitation({
  bandId,
  expiresAt,
  label,
}: CreateInvitationInput): Promise<CreatedInvitation> {
  const token = generateInvitationToken();
  const { data, error } = await getSupabaseClient().rpc('create_invitation', {
    p_band_id: bandId,
    p_expires_at: expiresAt ?? null,
    p_label: normalizeLabel(label),
    p_token: token,
  });

  if (error || typeof data !== 'string') {
    throw mapInvitationError(error?.message ?? 'invalid invitation response');
  }

  return { id: data, token, url: getShareableInviteUrl(token) };
}

export async function renewInvitation({
  expiresAt,
  invitationId,
}: {
  readonly expiresAt?: string;
  readonly invitationId: EntityId;
}): Promise<CreatedInvitation> {
  const token = generateInvitationToken();
  const { data, error } = await getSupabaseClient().rpc('renew_invitation', {
    p_expires_at: expiresAt ?? null,
    p_invitation_id: invitationId,
    p_token: token,
  });

  if (error || typeof data !== 'string') {
    throw mapInvitationError(error?.message ?? 'invalid invitation response');
  }

  return { id: data, token, url: getShareableInviteUrl(token) };
}

export async function revokeInvitation(invitationId: EntityId): Promise<void> {
  const { error } = await getSupabaseClient().rpc('revoke_invitation', {
    p_invitation_id: invitationId,
  });

  if (error) {
    throw mapInvitationError(error.message);
  }
}

export async function getInvitationPreview(
  token: string,
): Promise<InvitationPreview> {
  const { data, error } = await getSupabaseClient().rpc(
    'get_invitation_preview',
    { p_token: token },
  );
  const preview = Array.isArray(data) ? data[0] : data;

  if (error || !preview || typeof preview !== 'object') {
    throw mapInvitationError(error?.message ?? 'INVITATION_NOT_AVAILABLE');
  }

  const value = preview as Record<string, unknown>;

  if (
    typeof value.band_id !== 'string' ||
    typeof value.band_name !== 'string' ||
    typeof value.expires_at !== 'string'
  ) {
    throw mapInvitationError('INVITATION_NOT_AVAILABLE');
  }

  return {
    alreadyAccepted: value.already_accepted === true,
    bandId: value.band_id,
    bandName: value.band_name,
    expiresAt: value.expires_at,
    label: typeof value.label === 'string' ? value.label : null,
  };
}

export async function acceptInvitation(token: string): Promise<EntityId> {
  const { data, error } = await getSupabaseClient().rpc('accept_invitation', {
    p_token: token,
  });

  if (error || typeof data !== 'string') {
    throw mapInvitationError(error?.message ?? 'INVITATION_NOT_AVAILABLE');
  }

  return data;
}
