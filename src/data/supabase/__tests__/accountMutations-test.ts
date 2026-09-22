import { getSupabaseClient } from '@/data/supabase/client';
import {
  AccountDeletionError,
  deleteAccount,
} from '@/data/supabase/accountMutations';

jest.mock('@/data/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

const mockGetSupabaseClient = jest.mocked(getSupabaseClient);

describe('exclusão de conta no Supabase', () => {
  const rpc = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSupabaseClient.mockReturnValue({ rpc } as never);
  });

  it('solicita a exclusão transacional da conta', async () => {
    rpc.mockResolvedValue({ data: null, error: null });

    await expect(deleteAccount()).resolves.toBeUndefined();
    expect(rpc).toHaveBeenCalledWith('delete_account');
  });

  it('informa quando a conta ainda é o último Owner', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'ACCOUNT_LAST_OWNER_REQUIRED' },
    });

    await expect(deleteAccount()).rejects.toMatchObject<
      Partial<AccountDeletionError>
    >({
      code: 'last_owner',
    });
  });

  it('orienta excluir bandas solo antes da conta', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'ACCOUNT_SOLO_BAND_REQUIRED' },
    });

    await expect(deleteAccount()).rejects.toMatchObject<
      Partial<AccountDeletionError>
    >({
      code: 'solo_band',
    });
  });

  it.each([
    ['AUTHENTICATION_REQUIRED', 'authentication_required'],
    ['ACCOUNT_NOT_FOUND', 'account_not_found'],
    ['database timeout', 'request_failed'],
  ])('traduz %s como %s', async (message, code) => {
    rpc.mockResolvedValue({ data: null, error: { message } });

    await expect(deleteAccount()).rejects.toMatchObject({ code });
  });
});
