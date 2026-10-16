import { getSupabaseClient } from '@/data/supabase/client';
import { SupabaseSongRepository } from '@/data/supabase/songRepository';

jest.mock('@/data/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

const mockGetSupabaseClient = jest.mocked(getSupabaseClient);

type QueryResult = { data: unknown; error: Error | null };

type QueryMock = {
  eq: jest.Mock<QueryMock, [string, string]>;
  in: jest.Mock<QueryMock, [string, readonly string[]]>;
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
  query.in = jest.fn<QueryMock, [string, readonly string[]]>(() => query);
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

  it('lista resumo explícito sem buscar nem retornar letras', async () => {
    const query = createQuery({
      data: [
        {
          archived_at: null,
          band_id: 'band-real',
          bpm: 120,
          created_at: songRow.created_at,
          estimated_duration_ms: 180000,
          id: 'song-real',
          lyric_status: 'static',
          musical_key: 'G',
          original_artist: 'Artista original',
          title: 'Música real',
          updated_at: songRow.updated_at,
        },
      ],
      error: null,
    });
    from.mockReturnValue(query);

    const [summary] = await new SupabaseSongRepository().listSummariesByBandId(
      'band-real',
    );

    expect(summary).toEqual({
      archivedAt: null,
      bandId: 'band-real',
      bpm: 120,
      createdAt: songRow.created_at,
      estimatedDurationMs: 180000,
      id: 'song-real',
      lyricStatus: 'static',
      musicalKey: 'G',
      originalArtist: 'Artista original',
      title: 'Música real',
      updatedAt: songRow.updated_at,
    });
    expect(summary).not.toHaveProperty('lyrics');
    expect(query.select).toHaveBeenCalledWith(
      'id, band_id, title, original_artist, musical_key, bpm, estimated_duration_ms, lyric_status, archived_at, created_at, updated_at',
    );
    expect(query.eq).toHaveBeenCalledWith('band_id', 'band-real');
    expect(query.is).toHaveBeenCalledWith('archived_at', null);
  });

  it('busca documentos completos em lote, deduplica IDs e filtra resultados fora do escopo', async () => {
    const query = createQuery({
      data: [
        songRow,
        { ...songRow, id: 'song-not-requested' },
        { ...songRow, band_id: 'another-band', id: 'song-other-band' },
      ],
      error: null,
    });
    from.mockReturnValue(query);

    await expect(
      new SupabaseSongRepository().listDocumentsByIds('band-real', [
        'song-real',
        'song-real',
        'song-other-band',
      ]),
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
    expect(query.select).toHaveBeenCalledWith('*');
    expect(query.eq).toHaveBeenCalledWith('band_id', 'band-real');
    expect(query.in).toHaveBeenCalledWith('id', [
      'song-real',
      'song-other-band',
    ]);
  });

  it('não envia uma consulta em lote quando a lista de IDs está vazia', async () => {
    await expect(
      new SupabaseSongRepository().listDocumentsByIds('band-real', []),
    ).resolves.toEqual([]);
    expect(from).not.toHaveBeenCalled();
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

  it('inclui arquivadas quando solicitado', async () => {
    const query = createQuery({ data: [], error: null });
    from.mockReturnValue(query);

    await expect(
      new SupabaseSongRepository().listByBandId('band-real', {
        includeArchived: true,
      }),
    ).resolves.toEqual([]);
    expect(query.is).not.toHaveBeenCalled();
  });

  it('retorna lista remota vazia sem fallback local', async () => {
    const query = createQuery({ data: [], error: null });
    from.mockReturnValue(query);
    await expect(
      new SupabaseSongRepository().listByBandId('band-real'),
    ).resolves.toEqual([]);
  });

  it('consulta uma música dentro do escopo da banda e retorna null sem acesso', async () => {
    const query = createQuery({ data: null, error: null });
    from.mockReturnValue(query);
    await expect(
      new SupabaseSongRepository().findById('band-real', 'song-real'),
    ).resolves.toBeNull();
    expect(query.eq).toHaveBeenNthCalledWith(1, 'band_id', 'band-real');
    expect(query.eq).toHaveBeenNthCalledWith(2, 'id', 'song-real');
  });

  it('não resolve músicas demo localmente', async () => {
    const query = createQuery({ data: null, error: null });
    from.mockReturnValue(query);
    await expect(
      new SupabaseSongRepository().findById('band-demo', 'song-demo'),
    ).resolves.toBeNull();
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
