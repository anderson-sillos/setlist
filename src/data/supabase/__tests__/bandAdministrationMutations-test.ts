import { getSupabaseClient } from '@/data/supabase/client';
import {
  BandAdministrationError,
  deleteBand,
  updateBandName,
} from '@/data/supabase/bandAdministrationMutations';

jest.mock('@/data/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

const mockGetSupabaseClient = jest.mocked(getSupabaseClient);

describe('administração da banda no Supabase', () => {
  const from = jest.fn();
  const rpc = jest.fn();
  const update = jest.fn();
  const eq = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    eq.mockReturnThis();
    update.mockReturnValue({ eq });
    from.mockReturnValue({ update });
    mockGetSupabaseClient.mockReturnValue({ from, rpc } as never);
  });

  it('normaliza e atualiza o nome da banda', async () => {
    eq.mockReturnValueOnce({ error: null });

    await expect(
      updateBandName({ bandId: 'band-1', name: '  Banda Nova  ' }),
    ).resolves.toBeUndefined();
    expect(update).toHaveBeenCalledWith({ name: 'Banda Nova' });
    expect(eq).toHaveBeenCalledWith('id', 'band-1');
  });

  it('valida o nome antes de chamar o backend', async () => {
    await expect(
      updateBandName({ bandId: 'band-1', name: '   ' }),
    ).rejects.toMatchObject<Partial<BandAdministrationError>>({
      code: 'band_name_invalid',
    });
    expect(from).not.toHaveBeenCalled();
  });

  it('solicita a exclusão transacional da banda', async () => {
    rpc.mockResolvedValue({ data: null, error: null });

    await expect(deleteBand('band-1')).resolves.toBeUndefined();
    expect(rpc).toHaveBeenCalledWith('delete_band', { p_band_id: 'band-1' });
  });

  it('traduz a rejeição de exclusão por integrantes restantes', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'BAND_MUST_BE_SOLO_OWNER' },
    });

    await expect(deleteBand('band-1')).rejects.toMatchObject<
      Partial<BandAdministrationError>
    >({
      code: 'last_owner',
    });
  });

  it('traduz a falta de permissão para administrar a banda', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'BAND_OWNER_REQUIRED' },
    });

    await expect(deleteBand('band-1')).rejects.toMatchObject<
      Partial<BandAdministrationError>
    >({
      code: 'permission_denied',
    });
  });

  it('traduz falhas inesperadas ao atualizar o nome', async () => {
    eq.mockReturnValueOnce({ error: { message: 'database timeout' } });

    await expect(
      updateBandName({ bandId: 'band-1', name: 'Banda Nova' }),
    ).rejects.toMatchObject<Partial<BandAdministrationError>>({
      code: 'request_failed',
    });
  });
});
