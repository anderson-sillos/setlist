import { getSupabaseClient } from '@/data/supabase/client';
import { sendContentReport } from '@/data/supabase/contentReports';

jest.mock('@/data/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

const mockGetSupabaseClient = jest.mocked(getSupabaseClient);

describe('envio de denúncias de conteúdo', () => {
  const invoke = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSupabaseClient.mockReturnValue({
      functions: { invoke },
    } as never);
  });

  it('confirma somente quando a função informa que aceitou o envio', async () => {
    invoke.mockResolvedValueOnce({ data: { accepted: true }, error: null });

    await expect(
      sendContentReport({
        bandId: 'band-1',
        description: 'Descrição para análise',
        kind: 'song',
        targetId: 'song-1',
      }),
    ).resolves.toBeUndefined();

    expect(invoke).toHaveBeenCalledWith('report-content', {
      body: {
        bandId: 'band-1',
        description: 'Descrição para análise',
        kind: 'song',
        targetId: 'song-1',
      },
    });
  });

  it.each([
    { data: null, error: new Error('RATE_LIMITED') },
    { data: { accepted: false }, error: null },
    { data: null, error: new Error('DELIVERY_UNAVAILABLE') },
  ])('não confirma entrega recusada ou indisponível', async (result) => {
    invoke.mockResolvedValueOnce(result);

    await expect(
      sendContentReport({
        bandId: 'band-1',
        description: 'Descrição para análise',
        kind: 'user',
        targetId: 'user-2',
      }),
    ).rejects.toThrow(
      'Não foi possível confirmar o envio da denúncia. Tente novamente.',
    );
  });
});
