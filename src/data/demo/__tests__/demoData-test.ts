import {
  createDemoRepositories,
  demoIds,
  demoRepositoryData,
} from '@/data/demo';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('dados de demonstração', () => {
  it('carrega bandas, repertório e shows sem acessar um backend', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch');
    const repositories = createDemoRepositories();

    const userBands = await repositories.bands.listForUser(demoIds.currentUser);
    const songs = await repositories.songs.listByBandId(demoIds.primaryBand);
    const shows = await repositories.shows.listByBandId(demoIds.primaryBand);

    expect(userBands.map(({ band }) => band.name)).toEqual([
      'Banda Horizonte',
      'Trio Aurora',
    ]);
    expect(songs).toHaveLength(4);
    expect(shows).toHaveLength(3);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('representa papéis, estados de letra e estados de show do MVP', () => {
    expect(
      new Set(demoRepositoryData.bandMembers.map(({ role }) => role)),
    ).toEqual(new Set(['owner', 'editor', 'member']));
    expect(
      new Set(demoRepositoryData.songs.map(({ lyricStatus }) => lyricStatus)),
    ).toEqual(new Set(['missing', 'static', 'incomplete', 'synchronized']));
    expect(
      new Set(demoRepositoryData.shows.map(({ status }) => status)),
    ).toEqual(new Set(['draft', 'ready', 'cancelled']));
  });

  it('mantém cada item de setlist vinculado a uma música da mesma banda', () => {
    for (const show of demoRepositoryData.shows) {
      const songIds = new Set(
        demoRepositoryData.songs
          .filter(({ bandId }) => bandId === show.bandId)
          .map(({ id }) => id),
      );

      for (const block of show.blocks) {
        for (const item of block.items) {
          expect(songIds).toContain(item.songId);
        }
      }
    }
  });

  it('preserva a música arquivada em um show existente', async () => {
    const repositories = createDemoRepositories();
    const visibleSongs = await repositories.songs.listByBandId(
      demoIds.primaryBand,
    );
    const archivedSong = await repositories.songs.findById(
      demoIds.primaryBand,
      'song-demo-rota-antiga',
    );
    const cancelledShow = await repositories.shows.findById(
      demoIds.primaryBand,
      'show-demo-arquivo',
    );

    expect(visibleSongs.map(({ id }) => id)).not.toContain(
      'song-demo-rota-antiga',
    );
    expect(archivedSong?.archivedAt).not.toBeNull();
    expect(cancelledShow?.blocks[0]?.items[0]?.songId).toBe(archivedSong?.id);
  });

  it('fornece letras fictícias em blocos e linhas com ids estáveis', () => {
    const songsWithLyrics = demoRepositoryData.songs.filter(
      ({ lyrics }) => lyrics.blocks.length > 0,
    );
    const blockIds = songsWithLyrics.flatMap(({ lyrics }) =>
      lyrics.blocks.map(({ id }) => id),
    );
    const lineIds = songsWithLyrics.flatMap(({ lyrics }) =>
      lyrics.blocks.flatMap(({ lines }) => lines.map(({ id }) => id)),
    );

    expect(songsWithLyrics.length).toBeGreaterThan(0);
    expect(new Set(blockIds).size).toBe(blockIds.length);
    expect(new Set(lineIds).size).toBe(lineIds.length);
  });
});
