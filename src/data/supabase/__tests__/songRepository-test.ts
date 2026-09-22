import { getSupabaseClient } from '@/data/supabase/client';
import { SupabaseSongRepository } from '@/data/supabase/songRepository';

jest.mock('@/data/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

const mockGetSupabaseClient = jest.mocked(getSupabaseClient);

type QueryResult = { data: unknown; error: Error | null };

type QueryMock = {
  eq: jest.Mock<QueryMock, [string, string]>;
  is: jest.Mock<QueryMock, [string, null]>;
  maybeSingle: jest.Mock<Promise<QueryResult>, []>;
  select: jest.Mock<QueryMock, [string?]>;
  then: (
    onFulfilled: (value: QueryResult) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise<unknown>;
};

function createQuery(result: QueryResult) {
  const query = {} as QueryMock;
  query.eq = jest.fn<QueryMock, [string, string]>(() => query);
  query.is = jest.fn<QueryMock, [string, null]>(() => query);
  query.maybeSingle = jest.fn<Promise<QueryResult>, []>(() =>
    Promise.resolve(result),
  );
  query.select = jest.fn<QueryMock, [string?]>(() => query);
  query.then = (
    onFulfilled: (value: QueryResult) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(onFulfilled, onRejected);

  return query;
}

const songRow = {
  archived_at: null,
  band_id: 'band-real',
  bpm: 120,
  created_at: '2026-09-22T10:00:00.000Z',
  estimated_duration_ms: 180000,
  id: 'song-real',
  lyric_status: 'static',
  lyrics: {
    blocks: [
      {
        id: 'block-1',
        lines: [{ id: 'line-1', startTimeMs: null, text: 'Primeira linha' }],
        name: 'Verso',
      },
    ],
  },
  musical_key: 'G',
  notes: 'Observação',
  original_artist: 'Artista original',
  title: 'Música real',
  updated_at: '2026-09-22T12:00:00.000Z',
  youtube_reference: 'https://youtu.be/abc123',
};

describe('repositório de músicas do Supabase', () => {
  const from = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSupabaseClient.mockReturnValue({ from } as never);
  });

  it('lista músicas ativas da banda e mapeia campos e letra', async () => {
    const query = createQuery({ data: [songRow], error: null });
    from.mockReturnValue(query);

    await expect(
      new SupabaseSongRepository().listByBandId('band-real'),
    ).resolves.toEqual([
      {
        archivedAt: null,
        bandId: 'band-real',
        bpm: 120,
        createdAt: songRow.created_at,
        estimatedDurationMs: 180000,
        id: 'song-real',
        lyricStatus: 'static',
        lyrics: {
          blocks: [
            {
              id: 'block-1',
              lines: [
                { id: 'line-1', startTimeMs: null, text: 'Primeira linha' },
              ],
              name: 'Verso',
            },
          ],
        },
        musicalKey: 'G',
        notes: 'Observação',
        originalArtist: 'Artista original',
        title: 'Música real',
        updatedAt: songRow.updated_at,
        youtubeReference: 'https://youtu.be/abc123',
      },
    ]);
    expect(from).toHaveBeenCalledWith('songs');
    expect(query.eq).toHaveBeenCalledWith('band_id', 'band-real');
    expect(query.is).toHaveBeenCalledWith('archived_at', null);
  });

  it('inclui arquivadas quando solicitado e usa os dados demo só como fallback', async () => {
    const query = createQuery({ data: [], error: null });
    from.mockReturnValue(query);
    const demoSong = { id: 'demo-song', bandId: 'band-demo' };
    const demoRepository = {
      listByBandId: jest.fn().mockResolvedValue([demoSong]),
    };

    await expect(
      new SupabaseSongRepository(demoRepository as never).listByBandId(
        'band-demo',
        { includeArchived: true },
      ),
    ).resolves.toEqual([demoSong]);
    expect(query.is).not.toHaveBeenCalled();
    expect(demoRepository.listByBandId).toHaveBeenCalledWith('band-demo', {
      includeArchived: true,
    });
  });

  it('não substitui uma lista remota válida por dados demo', async () => {
    const query = createQuery({ data: [songRow], error: null });
    from.mockReturnValue(query);
    const demoRepository = {
      listByBandId: jest.fn().mockResolvedValue([{ id: 'demo-song' }]),
    };

    const result = await new SupabaseSongRepository(
      demoRepository as never,
    ).listByBandId('band-real');

    expect(result).toHaveLength(1);
    expect(demoRepository.listByBandId).not.toHaveBeenCalled();
  });

  it('consulta uma música dentro do escopo da banda e retorna null sem acesso', async () => {
    const query = createQuery({ data: null, error: null });
    from.mockReturnValue(query);
    const demoRepository = { findById: jest.fn().mockResolvedValue(null) };

    await expect(
      new SupabaseSongRepository(demoRepository as never).findById(
        'band-real',
        'song-real',
      ),
    ).resolves.toBeNull();
    expect(query.eq).toHaveBeenNthCalledWith(1, 'band_id', 'band-real');
    expect(query.eq).toHaveBeenNthCalledWith(2, 'id', 'song-real');
  });

  it('propaga falhas de leitura e rejeita respostas inválidas', async () => {
    const query = createQuery({ data: null, error: new Error('offline') });
    from.mockReturnValue(query);

    await expect(
      new SupabaseSongRepository().findById('band-real', 'song-real'),
    ).rejects.toThrow('offline');

    from.mockReturnValue(
      createQuery({ data: [{ ...songRow, bpm: 'rápido' }], error: null }),
    );
    await expect(
      new SupabaseSongRepository().listByBandId('band-real'),
    ).rejects.toThrow('Resposta inválida do Supabase: bpm.');
  });
});
