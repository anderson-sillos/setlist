import { createBand, createSong } from '@/testing/factories';
import { createInMemoryRepositories } from '@/testing/repositories';

const bandId = 'band-collections-test';
const songs = [
  createSong({
    bandId,
    estimatedDurationMs: 180_000,
    id: 'song-one',
    title: 'Abertura',
  }),
  createSong({
    bandId,
    estimatedDurationMs: 210_000,
    id: 'song-two',
    title: 'Caminho aberto',
  }),
  createSong({
    bandId,
    estimatedDurationMs: 240_000,
    id: 'song-three',
    title: 'Luzes da cidade',
  }),
] as const;

function createRepositories() {
  let id = 0;
  let second = 0;
  return createInMemoryRepositories(
    {
      bands: [createBand({ id: bandId, name: 'Banda das coleções' })],
      bandMembers: [],
      shows: [],
      songs,
      repertoireCollections: [],
      repertoireCollectionSongs: [],
    },
    {
      createId: () => 'collection-' + ++id,
      now: () =>
        '2026-10-08T12:00:' + String(second++).padStart(2, '0') + '.000Z',
    },
  );
}

describe('repositório em memória para estado de coleções', () => {
  it('reflete criação, edição e ordem nos resultados das consultas', async () => {
    const repositories = createRepositories();
    const collection = await repositories.repertoireCollections.save({
      bandId,
      name: 'Festa',
      orderedSongIds: [],
    });

    expect(collection.name).toBe('Festa');
    await expect(
      repositories.repertoireCollections.listSongsByBandId(bandId),
    ).resolves.toEqual([]);

    await repositories.repertoireCollections.save({
      bandId,
      collectionId: collection.id,
      expectedUpdatedAt: collection.updatedAt,
      name: 'Festival',
      orderedSongIds: [songs[2].id, songs[0].id],
    });

    const memberships =
      await repositories.repertoireCollections.listSongsByBandId(bandId);
    expect(
      memberships.map(({ songId, position }) => [songId, position]),
    ).toEqual([
      [songs[2].id, 0],
      [songs[0].id, 1],
    ]);
    await expect(
      repositories.repertoireCollections.findById(bandId, collection.id),
    ).resolves.toMatchObject({ name: 'Festival' });
  });

  it('reflete a inclusão de músicas ao final da ordem local', async () => {
    const repositories = createRepositories();
    const collection = await repositories.repertoireCollections.save({
      bandId,
      name: 'Acústico',
      orderedSongIds: [songs[0].id],
    });

    await repositories.repertoireCollections.appendSongs({
      bandId,
      collectionId: collection.id,
      songIds: [songs[2].id, songs[1].id],
    });

    const memberships =
      await repositories.repertoireCollections.listSongsByBandId(bandId);
    expect(
      memberships.map(({ songId, position }) => [songId, position]),
    ).toEqual([
      [songs[0].id, 0],
      [songs[2].id, 1],
      [songs[1].id, 2],
    ]);
  });

  it('atualiza vínculos selecionados e remove só a coleção', async () => {
    const repositories = createRepositories();
    const first = await repositories.repertoireCollections.save({
      bandId,
      name: 'Festa',
      orderedSongIds: [songs[0].id],
    });
    const second = await repositories.repertoireCollections.save({
      bandId,
      name: 'Ao ar livre',
      orderedSongIds: [],
    });

    await repositories.repertoireCollections.setSongCollections({
      bandId,
      songId: songs[0].id,
      collectionIds: [second.id],
      expectedRevisions: {},
    });
    await repositories.repertoireCollections.delete({
      bandId,
      collectionId: first.id,
      expectedUpdatedAt: first.updatedAt,
    });

    await expect(
      repositories.repertoireCollections.listByBandId(bandId),
    ).resolves.toEqual([
      expect.objectContaining({ id: second.id, name: 'Ao ar livre' }),
    ]);
    await expect(
      repositories.repertoireCollections.listSongsByBandId(bandId),
    ).resolves.toEqual([
      {
        bandId,
        collectionId: second.id,
        position: 0,
        songId: songs[0].id,
      },
    ]);
    await expect(repositories.songs.listByBandId(bandId)).resolves.toHaveLength(
      3,
    );
  });
});
