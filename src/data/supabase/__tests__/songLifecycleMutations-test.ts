import { getSupabaseClient } from '@/data/supabase/client';
import {
  archiveSong,
  removeSong,
  restoreSong,
  SongLifecycleMutationError,
} from '@/data/supabase/songLifecycleMutations';

jest.mock('@/data/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

const mockGetSupabaseClient = jest.mocked(getSupabaseClient);

describe('mutações do ciclo de vida de músicas', () => {
  const rpc = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSupabaseClient.mockReturnValue({ rpc } as never);
  });

  it('arquiva e restaura usando a RPC protegida', async () => {
    rpc.mockResolvedValue({ data: null, error: null });

    await archiveSong({ bandId: 'band-1', songId: 'song-1' });
    await restoreSong({ bandId: 'band-1', songId: 'song-1' });

    expect(rpc).toHaveBeenNthCalledWith(1, 'set_song_archived', {
      p_archived: true,
      p_band_id: 'band-1',
      p_song_id: 'song-1',
    });
    expect(rpc).toHaveBeenNthCalledWith(2, 'set_song_archived', {
      p_archived: false,
      p_band_id: 'band-1',
      p_song_id: 'song-1',
    });
  });

  it('preserva o resultado do banco ao excluir', async () => {
    rpc.mockResolvedValue({ data: 'deleted', error: null });
    await expect(
      removeSong({ bandId: 'band-1', songId: 'song-1' }),
    ).resolves.toBe('deleted');

    rpc.mockResolvedValue({ data: 'archived', error: null });
    await expect(
      removeSong({ bandId: 'band-1', songId: 'song-2' }),
    ).resolves.toBe('archived');
  });

  it('converte erros de autorização em mensagens seguras', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: {
        code: 'P0001',
        message: 'SONG_TERM_ACCEPTANCE_REQUIRED',
      },
    });

    await expect(
      archiveSong({ bandId: 'band-1', songId: 'song-1' }),
    ).rejects.toMatchObject({
      code: 'term_acceptance_required',
      message:
        'Aceite o termo vigente da banda antes de administrar esta música.',
    });

    rpc.mockResolvedValue({
      data: null,
      error: {
        code: 'P0001',
        message: 'SONG_ROLE_REQUIRED',
      },
    });

    await expect(
      removeSong({ bandId: 'band-1', songId: 'song-1' }),
    ).rejects.toBeInstanceOf(SongLifecycleMutationError);
  });

  it('rejeita uma resposta desconhecida do banco', async () => {
    rpc.mockResolvedValue({ data: 'unexpected', error: null });

    await expect(
      removeSong({ bandId: 'band-1', songId: 'song-1' }),
    ).rejects.toMatchObject({ code: 'request_failed' });
  });
  it('mapeia sessão expirada, música ausente e falhas inesperadas', async () => {
    for (const [message, code] of [
      ['AUTHENTICATION_REQUIRED', 'authentication_required'],
      ['SONG_NOT_FOUND', 'not_found'],
      ['database unavailable', 'request_failed'],
    ] as const) {
      rpc.mockResolvedValue({
        data: null,
        error: { code: 'P0001', message },
      });

      await expect(
        archiveSong({ bandId: 'band-1', songId: 'song-1' }),
      ).rejects.toMatchObject({ code });
    }
  });
});
