import {
  createDemoRepositories,
  demoIds,
  demoRepositoryData,
} from '@/data/demo';
import type { Show } from '@/domain';

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
    const secondarySongs = await repositories.songs.listByBandId(
      demoIds.secondaryBand,
    );
    const secondaryShows = await repositories.shows.listByBandId(
      demoIds.secondaryBand,
    );

    expect(userBands.map(({ band }) => band.name)).toEqual([
      'Banda Horizonte',
      'Trio Aurora',
    ]);
    expect(songs).toHaveLength(9);
    expect(shows).toHaveLength(9);
    expect(secondarySongs).toHaveLength(5);
    expect(secondaryShows).toHaveLength(4);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('inclui repertório de outros artistas e shows em várias datas para cada banda', () => {
    for (const band of demoRepositoryData.bands) {
      const activeSongs = demoRepositoryData.songs.filter(
        ({ archivedAt, bandId }) => bandId === band.id && archivedAt === null,
      );
      const songsFromOtherArtists = activeSongs.filter(
        ({ originalArtist }) => originalArtist !== band.name,
      );
      const showDates = new Set(
        demoRepositoryData.shows
          .filter(({ bandId }) => bandId === band.id)
          .map(({ startsAt }) => startsAt.slice(0, 10)),
      );

      expect(activeSongs.length).toBeGreaterThanOrEqual(5);
      expect(songsFromOtherArtists.length).toBeGreaterThanOrEqual(3);
      expect(showDates.size).toBeGreaterThanOrEqual(4);
    }
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
          if (item.type === 'song') {
            expect(songIds).toContain(item.songId);
          }
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
    const archivedItem = cancelledShow?.blocks[0]?.items[0];
    expect(archivedItem?.type).toBe('song');
    expect(archivedItem?.type === 'song' ? archivedItem.songId : null).toBe(
      archivedSong?.id,
    );
  });

  it('inclui várias anotações e separadores nos dados de planejamento', () => {
    const festival = demoRepositoryData.shows.find(
      ({ id }) => id === demoIds.readyShow,
    ) as Show | undefined;
    const items = festival?.blocks.flatMap(
      ({ items: blockItems }) => blockItems,
    );

    expect(items?.filter(({ type }) => type === 'planning')).toHaveLength(3);
    expect(items?.some(({ type }) => type === 'separator')).toBe(true);
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
