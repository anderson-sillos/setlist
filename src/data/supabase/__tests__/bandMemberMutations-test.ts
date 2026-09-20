import { getSupabaseClient } from '@/data/supabase/client';
import {
  BandMemberMutationError,
  removeBandMember,
  updateBandMemberRole,
} from '@/data/supabase/bandMemberMutations';

jest.mock('@/data/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

const mockGetSupabaseClient = jest.mocked(getSupabaseClient);

describe('administração de integrantes no Supabase', () => {
  const from = jest.fn();
  const update = jest.fn();
  const remove = jest.fn();
  const eq = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    eq.mockReturnThis();
    update.mockReturnValue({ eq });
    remove.mockReturnValue({ eq });
    from.mockReturnValue({ delete: remove, update });
    mockGetSupabaseClient.mockReturnValue({ from } as never);
  });

  it('promove um integrante para proprietário', async () => {
    eq.mockReturnValueOnce({ eq }).mockReturnValueOnce({ error: null });

    await expect(
      updateBandMemberRole({
        bandId: 'band-1',
        memberId: 'membership-1',
        role: 'owner',
      }),
    ).resolves.toBeUndefined();
    expect(from).toHaveBeenCalledWith('band_members');
    expect(update).toHaveBeenCalledWith({ role: 'owner' });
    expect(eq).toHaveBeenNthCalledWith(1, 'band_id', 'band-1');
    expect(eq).toHaveBeenNthCalledWith(2, 'id', 'membership-1');
  });

  it('remove um integrante e traduz a proteção do último proprietário', async () => {
    eq.mockReturnValueOnce({ eq }).mockReturnValueOnce({
      error: { message: 'LAST_OWNER' },
    });

    await expect(
      removeBandMember({ bandId: 'band-1', memberId: 'membership-1' }),
    ).rejects.toMatchObject<Partial<BandMemberMutationError>>({
      code: 'last_owner',
    });
    expect(remove).toHaveBeenCalled();
  });

  it('não expõe detalhes internos quando a atualização falha', async () => {
    eq.mockReturnValueOnce({ eq }).mockReturnValueOnce({
      error: { message: 'permission denied by row-level security policy' },
    });

    await expect(
      updateBandMemberRole({
        bandId: 'band-1',
        memberId: 'membership-1',
        role: 'owner',
      }),
    ).rejects.toMatchObject<Partial<BandMemberMutationError>>({
      code: 'permission_denied',
      message: 'Só um Proprietário pode administrar integrantes desta banda.',
    });
  });

  it('usa uma mensagem segura para falhas inesperadas', async () => {
    eq.mockReturnValueOnce({ eq }).mockReturnValueOnce({
      error: { message: 'database timeout' },
    });

    await expect(
      removeBandMember({ bandId: 'band-1', memberId: 'membership-1' }),
    ).rejects.toMatchObject<Partial<BandMemberMutationError>>({
      code: 'request_failed',
      message:
        'Não foi possível atualizar os integrantes agora. Tente novamente.',
    });
  });
});
