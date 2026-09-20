import { getSupabaseClient } from '@/data/supabase/client';
import { BandCreationError, createBand } from '@/data/supabase/bandMutations';

jest.mock('@/data/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

const mockGetSupabaseClient = jest.mocked(getSupabaseClient);

describe('criação de banda no Supabase', () => {
  const rpc = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSupabaseClient.mockReturnValue({ rpc } as never);
  });

  it('exige o aceite antes de chamar o backend', async () => {
    await expect(
      createBand({
        acceptedTerm: false,
        name: 'Banda sem aceite',
        termVersion: '2026-09',
      }),
    ).rejects.toMatchObject<Partial<BandCreationError>>({
      code: 'acceptance_required',
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('normaliza o nome e registra a versão do termo no RPC transacional', async () => {
    rpc.mockResolvedValue({ data: 'band-1', error: null });

    await expect(
      createBand({
        acceptedTerm: true,
        name: '  Banda Horizonte  ',
        termVersion: ' 2026-09 ',
      }),
    ).resolves.toBe('band-1');
    expect(rpc).toHaveBeenCalledWith('create_band', {
      p_accepted: true,
      p_name: 'Banda Horizonte',
      p_term_version: '2026-09',
    });
  });

  it('valida nome e versão antes de enviar dados ao servidor', async () => {
    await expect(
      createBand({
        acceptedTerm: true,
        name: '   ',
        termVersion: '2026-09',
      }),
    ).rejects.toMatchObject<Partial<BandCreationError>>({
      code: 'band_name_invalid',
    });
    await expect(
      createBand({
        acceptedTerm: true,
        name: 'Banda',
        termVersion: '   ',
      }),
    ).rejects.toMatchObject<Partial<BandCreationError>>({
      code: 'term_version_required',
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('converte erros de validação do servidor em mensagens seguras', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'BAND_NAME_INVALID' },
    });

    await expect(
      createBand({
        acceptedTerm: true,
        name: 'Banda',
        termVersion: '2026-09',
      }),
    ).rejects.toMatchObject<Partial<BandCreationError>>({
      code: 'band_name_invalid',
    });
  });

  it.each([
    ['AUTHENTICATION_REQUIRED', 'authentication_required'],
    ['TERM_VERSION_REQUIRED', 'term_version_required'],
    ['NETWORK_ERROR', 'request_failed'],
  ] as const)(
    'mapeia o erro %s sem expor detalhes internos',
    async (serverError, code) => {
      rpc.mockResolvedValue({ data: null, error: { message: serverError } });

      await expect(
        createBand({
          acceptedTerm: true,
          name: 'Banda',
          termVersion: '2026-09',
        }),
      ).rejects.toMatchObject<Partial<BandCreationError>>({ code });
    },
  );

  it('rejeita uma resposta sem identificador de banda', async () => {
    rpc.mockResolvedValue({ data: null, error: null });

    await expect(
      createBand({
        acceptedTerm: true,
        name: 'Banda',
        termVersion: '2026-09',
      }),
    ).rejects.toMatchObject<Partial<BandCreationError>>({
      code: 'request_failed',
    });
  });
});
