import * as ExpoCrypto from 'expo-crypto';

import { getShareableInviteUrl } from '@/features/auth/authLinks';
import { getSupabaseClient } from '@/data/supabase/client';
import {
  InvitationMutationError,
  acceptInvitation,
  createInvitation,
  getInvitationPreview,
  listInvitations,
  renewInvitation,
  revokeInvitation,
} from '@/data/supabase/invitationMutations';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'token-uuid'),
}));

jest.mock('@/features/auth/authLinks', () => ({
  getShareableInviteUrl: jest.fn(
    (token: string) => `https://app/invite/${token}`,
  ),
}));

jest.mock('@/data/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

const mockGetSupabaseClient = jest.mocked(getSupabaseClient);
const mockGetShareableInviteUrl = jest.mocked(getShareableInviteUrl);
const mockRandomUuid = jest.mocked(ExpoCrypto.randomUUID);

describe('convites da banda no Supabase', () => {
  const from = jest.fn();
  const rpc = jest.fn();
  const select = jest.fn();
  const eq = jest.fn();
  const order = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    eq.mockReturnThis();
    select.mockReturnValue({ eq });
    eq.mockReturnValue({ order });
    from.mockReturnValue({ select });
    mockGetSupabaseClient.mockReturnValue({ from, rpc } as never);
  });

  it('lista e classifica convites por estado', async () => {
    order.mockResolvedValue({
      data: [
        {
          band_id: 'band-1',
          created_at: '2026-09-20T10:00:00.000Z',
          expires_at: '2099-09-20T10:00:00.000Z',
          id: 'invite-1',
          label: 'Baixista',
          revoked_at: null,
          used_at: null,
        },
      ],
      error: null,
    });

    await expect(listInvitations('band-1')).resolves.toEqual([
      expect.objectContaining({
        id: 'invite-1',
        label: 'Baixista',
        status: 'active',
      }),
    ]);
    expect(eq).toHaveBeenCalledWith('band_id', 'band-1');
  });

  it('classifica convites usados, revogados e expirados', async () => {
    order.mockResolvedValue({
      data: [
        {
          band_id: 'band-1',
          created_at: '2026-09-20T10:00:00.000Z',
          expires_at: '2099-09-20T10:00:00.000Z',
          id: 'invite-used',
          label: null,
          revoked_at: null,
          used_at: '2026-09-20T11:00:00.000Z',
        },
        {
          band_id: 'band-1',
          created_at: '2026-09-20T10:00:00.000Z',
          expires_at: '2099-09-20T10:00:00.000Z',
          id: 'invite-revoked',
          label: null,
          revoked_at: '2026-09-20T11:00:00.000Z',
          used_at: null,
        },
        {
          band_id: 'band-1',
          created_at: '2026-09-20T10:00:00.000Z',
          expires_at: '2020-09-20T10:00:00.000Z',
          id: 'invite-expired',
          label: null,
          revoked_at: null,
          used_at: null,
        },
      ],
      error: null,
    });

    await expect(listInvitations('band-1')).resolves.toEqual([
      expect.objectContaining({ status: 'used' }),
      expect.objectContaining({ status: 'revoked' }),
      expect.objectContaining({ status: 'expired' }),
    ]);
  });

  it('traduz falha ao listar e rejeita resposta inválida', async () => {
    order.mockResolvedValue({
      data: null,
      error: { message: 'permission denied' },
    });
    await expect(listInvitations('band-1')).rejects.toMatchObject({
      code: 'permission_denied',
    });

    order.mockResolvedValue({
      data: [{ band_id: 'band-1' }],
      error: null,
    });
    await expect(listInvitations('band-1')).rejects.toThrow(
      'Resposta inválida do Supabase: created_at.',
    );
  });

  it('gera token, envia somente o token ao RPC e devolve link compartilhável', async () => {
    rpc.mockResolvedValue({ data: 'invite-1', error: null });

    await expect(
      createInvitation({ bandId: 'band-1', label: '  Baixista  ' }),
    ).resolves.toEqual({
      id: 'invite-1',
      token: 'token-uuid',
      url: 'https://app/invite/token-uuid',
    });
    expect(mockRandomUuid).toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledWith('create_invitation', {
      p_band_id: 'band-1',
      p_expires_at: null,
      p_label: 'Baixista',
      p_token: 'token-uuid',
    });
    expect(mockGetShareableInviteUrl).toHaveBeenCalledWith('token-uuid');
  });

  it.each([
    ['INVITATION_LABEL_INVALID', 'invalid'],
    ['permission denied', 'permission_denied'],
    ['database timeout', 'request_failed'],
  ] as const)('traduz erro de criação %s', async (message, code) => {
    rpc.mockResolvedValue({ data: null, error: { message } });

    await expect(createInvitation({ bandId: 'band-1' })).rejects.toMatchObject({
      code,
    });
  });

  it('renova criando um novo token e revoga o anterior no servidor', async () => {
    rpc.mockResolvedValue({ data: 'invite-2', error: null });

    await expect(
      renewInvitation({ invitationId: 'invite-1' }),
    ).resolves.toEqual(
      expect.objectContaining({ id: 'invite-2', token: 'token-uuid' }),
    );
    expect(rpc).toHaveBeenCalledWith('renew_invitation', {
      p_expires_at: null,
      p_invitation_id: 'invite-1',
      p_token: 'token-uuid',
    });
  });

  it('traduz erro de renovação e revogação', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'INVITATION_NOT_AVAILABLE' },
    });

    await expect(
      renewInvitation({ invitationId: 'invite-1' }),
    ).rejects.toMatchObject({
      code: 'not_available',
    });
    await expect(revokeInvitation('invite-1')).rejects.toMatchObject({
      code: 'not_available',
    });
  });

  it('revoga e aceita convites por funções transacionais', async () => {
    rpc
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: 'band-1', error: null });

    await expect(revokeInvitation('invite-1')).resolves.toBeUndefined();
    await expect(acceptInvitation('token-uuid')).resolves.toBe('band-1');
    expect(rpc).toHaveBeenNthCalledWith(1, 'revoke_invitation', {
      p_invitation_id: 'invite-1',
    });
    expect(rpc).toHaveBeenNthCalledWith(2, 'accept_invitation', {
      p_token: 'token-uuid',
    });
  });

  it('converte convite indisponível em erro seguro', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'INVITATION_NOT_AVAILABLE' },
    });

    await expect(getInvitationPreview('expired-token')).rejects.toMatchObject<
      Partial<InvitationMutationError>
    >({ code: 'not_available' });
  });

  it('lê prévia em formato de tabela e aceita o convite', async () => {
    rpc
      .mockResolvedValueOnce({
        data: [
          {
            band_id: 'band-1',
            band_name: 'Banda Horizonte',
            expires_at: '2099-09-20T10:00:00.000Z',
            label: 'Tecladista',
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({ data: 'band-1', error: null });

    await expect(getInvitationPreview('token-uuid')).resolves.toEqual({
      bandId: 'band-1',
      bandName: 'Banda Horizonte',
      expiresAt: '2099-09-20T10:00:00.000Z',
      label: 'Tecladista',
    });
    await expect(acceptInvitation('token-uuid')).resolves.toBe('band-1');
  });

  it('aceita a prévia em objeto quando o convite não tem rótulo', async () => {
    rpc.mockResolvedValue({
      data: {
        band_id: 'band-1',
        band_name: 'Banda Horizonte',
        expires_at: '2099-09-20T10:00:00.000Z',
        label: null,
      },
      error: null,
    });

    await expect(getInvitationPreview('token-uuid')).resolves.toEqual(
      expect.objectContaining({ label: null }),
    );
  });

  it('traduz erros de prévia e aceite', async () => {
    rpc.mockResolvedValueOnce({
      data: { band_id: 'band-1' },
      error: null,
    });
    await expect(getInvitationPreview('token-uuid')).rejects.toMatchObject({
      code: 'not_available',
    });

    rpc.mockResolvedValueOnce({ data: null, error: { message: 'timeout' } });
    await expect(acceptInvitation('token-uuid')).rejects.toMatchObject({
      code: 'request_failed',
    });
  });
});
