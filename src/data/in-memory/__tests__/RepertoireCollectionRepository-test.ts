import { demoRepositoryData } from '@/data/demo/demoData';
import { createInMemoryRepositories } from '@/data/in-memory';

const bandId = 'band-collections-test';
const songs = demoRepositoryData.songs.slice(0, 3).map((song, index) => ({
  ...song,
  bandId,
  id: `song-${index + 1}`,
}));

function createRepositories() {
  let id = 0;
  let second = 0;
  return createInMemoryRepositories(
    {
      bands: [{ ...demoRepositoryData.bands[0], id: bandId }],
      bandMembers: [],
      shows: [],
      songs,
      repertoireCollections: [],
      repertoireCollectionSongs: [],
    },
    {
      createId: () => `collection-${++id}`,
      now: () => `2026-10-08T12:00:${String(second++).padStart(2, '0')}.000Z`,
    },
  );
}

describe('repositório em memória de coleções do repertório', () => {
  it('cria coleções vazias e salva nome e ordem na revisão atual', async () => {
    const repositories = createRepositories();
    const collection = await repositories.repertoireCollections.save({
      bandId,
      name: '  Festa  ',
      orderedSongIds: [],
    });

    expect(collection.name).toBe('Festa');
    expect(
      await repositories.repertoireCollections.listSongsByBandId(bandId),
    ).toEqual([]);

    const updated = await repositories.repertoireCollections.save({
      bandId,
      collectionId: collection.id,
      expectedUpdatedAt: collection.updatedAt,
      name: 'Festival',
      orderedSongIds: [songs[2].id, songs[0].id],
    });

    expect(updated.name).toBe('Festival');
    expect(
      (await repositories.repertoireCollections.listSongsByBandId(bandId))
        .filter((membership) => membership.collectionId === collection.id)
        .map((membership) => membership.songId),
    ).toEqual([songs[2].id, songs[0].id]);
  });

  it('reordena participações existentes sem duplicar vínculos', async () => {
    const repositories = createRepositories();
    const collection = await repositories.repertoireCollections.save({
      bandId,
      name: 'Festival',
      orderedSongIds: [songs[0].id, songs[1].id, songs[2].id],
    });

    await repositories.repertoireCollections.save({
      bandId,
      collectionId: collection.id,
      expectedUpdatedAt: collection.updatedAt,
      name: collection.name,
      orderedSongIds: [songs[2].id, songs[0].id],
    });

    expect(
      (await repositories.repertoireCollections.listSongsByBandId(bandId))
        .filter((membership) => membership.collectionId === collection.id)
        .map(({ songId, position }) => [songId, position]),
    ).toEqual([
      [songs[2].id, 0],
      [songs[0].id, 1],
    ]);
  });

  it('anexa músicas em ordem e ignora participações já existentes', async () => {
    const repositories = createRepositories();
    const collection = await repositories.repertoireCollections.save({
      bandId,
      name: 'Acústico',
      orderedSongIds: [songs[0].id],
    });

    await repositories.repertoireCollections.appendSongs({
      bandId,
      collectionId: collection.id,
      songIds: [songs[0].id, songs[2].id, songs[1].id],
    });

    expect(
      (await repositories.repertoireCollections.listSongsByBandId(bandId))
        .filter((membership) => membership.collectionId === collection.id)
        .map(({ songId, position }) => [songId, position]),
    ).toEqual([
      [songs[0].id, 0],
      [songs[2].id, 1],
      [songs[1].id, 2],
    ]);
  });

  it('atualiza participações de uma música preservando ordem e rejeita revisão antiga', async () => {
    const repositories = createRepositories();
    const first = await repositories.repertoireCollections.save({
      bandId,
      name: 'Festa',
      orderedSongIds: [songs[0].id, songs[1].id],
    });
    const second = await repositories.repertoireCollections.save({
      bandId,
      name: 'Ao ar livre',
      orderedSongIds: [songs[2].id],
    });

    await repositories.repertoireCollections.setSongCollections({
      bandId,
      songId: songs[2].id,
      collectionIds: [first.id],
      expectedRevisions: {
        [first.id]: first.updatedAt,
        [second.id]: second.updatedAt,
      },
    });

    const memberships =
      await repositories.repertoireCollections.listSongsByBandId(bandId);
    expect(
      memberships
        .filter((membership) => membership.collectionId === first.id)
        .map(({ songId, position }) => [songId, position]),
    ).toEqual([
      [songs[0].id, 0],
      [songs[1].id, 1],
      [songs[2].id, 2],
    ]);
    expect(
      memberships.filter((membership) => membership.collectionId === second.id),
    ).toEqual([]);

    await expect(
      repositories.repertoireCollections.setSongCollections({
        bandId,
        songId: songs[1].id,
        collectionIds: [],
        expectedRevisions: { [first.id]: first.updatedAt },
      }),
    ).rejects.toMatchObject({ code: 'stale_revision' });
  });

  it('rejeita nomes equivalentes e não altera a lista em falha', async () => {
    const repositories = createRepositories();
    await repositories.repertoireCollections.save({
      bandId,
      name: 'Festa',
      orderedSongIds: [],
    });

    await expect(
      repositories.repertoireCollections.save({
        bandId,
        name: ' festa ',
        orderedSongIds: [],
      }),
    ).rejects.toMatchObject({ code: 'duplicate_name' });
    await expect(
      repositories.repertoireCollections.save({
        bandId,
        name: '   ',
        orderedSongIds: [],
      }),
    ).rejects.toMatchObject({ code: 'invalid_name' });
    expect(
      await repositories.repertoireCollections.listByBandId(bandId),
    ).toHaveLength(1);
  });

  it('exclui vínculos da coleção, mas mantém os cadastros de música', async () => {
    const repositories = createRepositories();
    const collection = await repositories.repertoireCollections.save({
      bandId,
      name: 'Dançante',
      orderedSongIds: [songs[0].id],
    });

    await repositories.repertoireCollections.delete({
      bandId,
      collectionId: collection.id,
      expectedUpdatedAt: collection.updatedAt,
    });

    expect(
      await repositories.repertoireCollections.listByBandId(bandId),
    ).toEqual([]);
    expect(
      await repositories.repertoireCollections.listSongsByBandId(bandId),
    ).toEqual([]);
    expect(await repositories.songs.listByBandId(bandId)).toHaveLength(3);
  });
});
