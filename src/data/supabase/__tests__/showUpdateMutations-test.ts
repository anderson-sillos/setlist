import { getSupabaseClient } from '@/data/supabase/client';
import { updateShowStatus } from '@/data/supabase/showUpdateMutations';

jest.mock('@/data/supabase/client', () => ({ getSupabaseClient: jest.fn() }));

const mockGetSupabaseClient = jest.mocked(getSupabaseClient);

describe('mutações de status de shows', () => {
  const from = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSupabaseClient.mockReturnValue({ from } as never);
  });

  it('permite reabrir um show Pronto e persiste o novo status', async () => {
    const query = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      maybeSingle: jest
        .fn()
        .mockResolvedValue({ data: { id: 'show-1' }, error: null }),
    };
    from.mockReturnValue(query);

    await expect(
      updateShowStatus({
        bandId: 'band-1',
        currentStatus: 'ready',
        showId: 'show-1',
        status: 'draft',
      }),
    ).resolves.toBeUndefined();

    expect(query.update).toHaveBeenCalledWith({ status: 'draft' });
    expect(query.eq).toHaveBeenNthCalledWith(1, 'id', 'show-1');
    expect(query.eq).toHaveBeenNthCalledWith(2, 'band_id', 'band-1');
  });

  it('rejeita uma transição que não está disponível', async () => {
    await expect(
      updateShowStatus({
        bandId: 'band-1',
        currentStatus: 'cancelled',
        showId: 'show-1',
        status: 'ready',
      }),
    ).rejects.toMatchObject({ code: 'invalid_show' });
    expect(from).not.toHaveBeenCalled();
  });
});
