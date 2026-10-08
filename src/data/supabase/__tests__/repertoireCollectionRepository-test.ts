import { getSupabaseClient } from '@/data/supabase/client';
import { SupabaseRepertoireCollectionRepository } from '@/data/supabase/repertoireCollectionRepository';

jest.mock('@/data/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

const mockGetSupabaseClient = jest.mocked(getSupabaseClient);

type QueryResult = {
  data: unknown;
  error: { code?: string; message: string } | null;
};

type QueryMock = {
  eq: jest.Mock<QueryMock, [string, string]>;
  maybeSingle: jest.Mock<Promise<QueryResult>, []>;
  order: jest.Mock<QueryMock, [string, { ascending: boolean }?]>;
  select: jest.Mock<QueryMock, [string?]>;
  then: (
    onFulfilled: (value: QueryResult) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise<unknown>;
};

function createQuery(result: QueryResult) {
  const query = {} as QueryMock;
  query.eq = jest.fn<QueryMock, [string, string]>(() => query);
  query.maybeSingle = jest.fn<Promise<QueryResult>, []>(() =>
    Promise.resolve(result),
  );
  query.order = jest.fn<QueryMock, [string, { ascending: boolean }?]>(
    () => query,
  );
  query.select = jest.fn<QueryMock, [string?]>(() => query);
  query.then = (
    onFulfilled: (value: QueryResult) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(onFulfilled, onRejected);
  return query;
}

const collectionRow = {
  band_id: 'band-real',
  created_at: '2026-10-08T12:00:00.000Z',
  id: 'collection-real',
  name: 'Festa',
  updated_at: '2026-10-08T12:05:00.000Z',
};

describe('repositório de coleções do Supabase', () => {
  const from = jest.fn();
  const rpc = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSupabaseClient.mockReturnValue({ from, rpc } as never);
  });

  it('consulta coleções no escopo da banda e mapeia as revisões', async () => {
    const query = createQuery({ data: [collectionRow], error: null });
    from.mockReturnValue(query);

    await expect(
      new SupabaseRepertoireCollectionRepository().listByBandId('band-real'),
    ).resolves.toEqual([
      {
        bandId: 'band-real',
        createdAt: collectionRow.created_at,
        id: 'collection-real',
        name: 'Festa',
        updatedAt: collectionRow.updated_at,
      },
    ]);
    expect(from).toHaveBeenCalledWith('repertoire_collections');
    expect(query.eq).toHaveBeenCalledWith('band_id', 'band-real');
    expect(query.order).toHaveBeenCalledWith('name', { ascending: true });
  });

  it('consulta os vínculos em lote e os ordena por coleção e posição', async () => {
    const query = createQuery({
      data: [
        {
          band_id: 'band-real',
          collection_id: 'collection-real',
          position: 2,
          song_id: 'song-real',
        },
      ],
      error: null,
    });
    from.mockReturnValue(query);

    await expect(
      new SupabaseRepertoireCollectionRepository().listSongsByBandId(
        'band-real',
      ),
    ).resolves.toEqual([
      {
        bandId: 'band-real',
        collectionId: 'collection-real',
        position: 2,
        songId: 'song-real',
      },
    ]);
    expect(query.order).toHaveBeenNthCalledWith(1, 'collection_id', {
      ascending: true,
    });
    expect(query.order).toHaveBeenNthCalledWith(2, 'position', {
      ascending: true,
    });
  });

  it('salva coleção e ordem em uma RPC e recarrega sua revisão', async () => {
    const query = createQuery({ data: collectionRow, error: null });
    from.mockReturnValue(query);
    rpc.mockResolvedValue({ data: 'collection-real', error: null });

    await expect(
      new SupabaseRepertoireCollectionRepository().save({
        bandId: 'band-real',
        collectionId: 'collection-real',
        expectedUpdatedAt: collectionRow.updated_at,
        name: 'Festa revisada',
        orderedSongIds: ['song-2', 'song-1'],
      }),
    ).resolves.toEqual({
      bandId: 'band-real',
      createdAt: collectionRow.created_at,
      id: 'collection-real',
      name: 'Festa',
      updatedAt: collectionRow.updated_at,
    });
    expect(rpc).toHaveBeenCalledWith('save_repertoire_collection', {
      p_band_id: 'band-real',
      p_collection_id: 'collection-real',
      p_expected_updated_at: collectionRow.updated_at,
      p_name: 'Festa revisada',
      p_song_ids: ['song-2', 'song-1'],
    });
    expect(query.eq).toHaveBeenCalledWith('band_id', 'band-real');
    expect(query.eq).toHaveBeenCalledWith('id', 'collection-real');
  });

  it('encaminha participações e revisões sem gravações em partes', async () => {
    rpc.mockResolvedValue({ data: null, error: null });

    await expect(
      new SupabaseRepertoireCollectionRepository().setSongCollections({
        bandId: 'band-real',
        songId: 'song-real',
        collectionIds: ['collection-real'],
        expectedRevisions: { 'collection-real': collectionRow.updated_at },
      }),
    ).resolves.toBeUndefined();
    expect(rpc).toHaveBeenCalledWith('set_song_repertoire_collections', {
      p_band_id: 'band-real',
      p_collection_ids: ['collection-real'],
      p_expected_revisions: {
        'collection-real': collectionRow.updated_at,
      },
      p_song_id: 'song-real',
    });
  });

  it('traduz conflito de revisão em erro recuperável de domínio', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { code: 'P0001', message: 'COLLECTION_CHANGED' },
    });

    await expect(
      new SupabaseRepertoireCollectionRepository().delete({
        bandId: 'band-real',
        collectionId: 'collection-real',
        expectedUpdatedAt: collectionRow.updated_at,
      }),
    ).rejects.toMatchObject({ code: 'stale_revision' });
  });
});
