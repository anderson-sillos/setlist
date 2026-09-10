import {
  createInMemoryRepositories,
  type InMemoryRepositoryData,
} from '@/data/in-memory';
import type { Band, BandMember, LyricDocument, Show, Song } from '@/domain';

const createdAt = '2026-09-01T12:00:00.000Z';
const updatedAt = '2026-09-02T12:00:00.000Z';
const archivedAt = '2026-09-03T12:00:00.000Z';

const bands: readonly Band[] = [
  { id: 'band-1', name: 'Banda Horizonte', createdAt, updatedAt },
  { id: 'band-2', name: 'Banda Aurora', createdAt, updatedAt },
];

const bandMembers: readonly BandMember[] = [
  {
    id: 'member-1',
    bandId: 'band-1',
    userId: 'user-1',
    displayName: 'Ana',
    role: 'owner',
    joinedAt: createdAt,
  },
  {
    id: 'member-2',
    bandId: 'band-1',
    userId: 'user-2',
    displayName: 'Beto',
    role: 'member',
    joinedAt: createdAt,
  },
  {
    id: 'member-3',
    bandId: 'band-2',
    userId: 'user-1',
    displayName: 'Ana',
    role: 'editor',
    joinedAt: createdAt,
  },
];

const emptyLyrics: LyricDocument = { blocks: [] };

const songs: readonly Song[] = [
  {
    id: 'song-1',
    bandId: 'band-1',
    title: 'Caminho aberto',
    originalArtist: null,
    musicalKey: 'G',
    bpm: 120,
    estimatedDurationMs: 210_000,
    youtubeReference: null,
    lyrics: emptyLyrics,
    lyricStatus: 'missing',
    notes: null,
    archivedAt: null,
    createdAt,
    updatedAt,
  },
  {
    id: 'song-2',
    bandId: 'band-1',
    title: 'Canção arquivada',
    originalArtist: null,
    musicalKey: null,
    bpm: null,
    estimatedDurationMs: null,
    youtubeReference: null,
    lyrics: emptyLyrics,
    lyricStatus: 'missing',
    notes: null,
    archivedAt,
    createdAt,
    updatedAt,
  },
  {
    id: 'song-3',
    bandId: 'band-2',
    title: 'Outra banda',
    originalArtist: null,
    musicalKey: null,
    bpm: null,
    estimatedDurationMs: null,
    youtubeReference: null,
    lyrics: emptyLyrics,
    lyricStatus: 'static',
    notes: null,
    archivedAt: null,
    createdAt,
    updatedAt,
  },
];

const shows: readonly Show[] = [
  {
    id: 'show-1',
    bandId: 'band-1',
    name: 'Festival de verão',
    startsAt: '2026-12-12T21:00:00.000Z',
    venue: 'Praça Central',
    notes: null,
    status: 'draft',
    blocks: [],
    createdAt,
    updatedAt,
  },
  {
    id: 'show-2',
    bandId: 'band-2',
    name: 'Ensaio aberto',
    startsAt: '2026-11-15T19:00:00.000Z',
    venue: 'Estúdio Norte',
    notes: null,
    status: 'ready',
    blocks: [],
    createdAt,
    updatedAt,
  },
];

const data: InMemoryRepositoryData = {
  bands,
  bandMembers,
  songs,
  shows,
};

describe('repositórios em memória', () => {
  const repositories = createInMemoryRepositories(data);

  describe('bandas', () => {
    it('lista somente as bandas das quais o usuário participa', async () => {
      const result = await repositories.bands.listForUser('user-1');

      expect(result).toEqual([
        { band: bands[0], membership: bandMembers[0] },
        { band: bands[1], membership: bandMembers[2] },
      ]);
      await expect(
        repositories.bands.listForUser('user-without-band'),
      ).resolves.toEqual([]);
    });

    it('consulta uma banda e seus integrantes', async () => {
      await expect(repositories.bands.findById('band-1')).resolves.toBe(
        bands[0],
      );
      await expect(repositories.bands.findById('unknown')).resolves.toBeNull();
      await expect(repositories.bands.listMembers('band-1')).resolves.toEqual([
        bandMembers[0],
        bandMembers[1],
      ]);
    });
  });

  describe('músicas', () => {
    it('isola o repertório por banda e omite arquivadas por padrão', async () => {
      await expect(repositories.songs.listByBandId('band-1')).resolves.toEqual([
        songs[0],
      ]);
      await expect(repositories.songs.listByBandId('band-2')).resolves.toEqual([
        songs[2],
      ]);
    });

    it('inclui músicas arquivadas somente quando solicitado', async () => {
      await expect(
        repositories.songs.listByBandId('band-1', {
          includeArchived: true,
        }),
      ).resolves.toEqual([songs[0], songs[1]]);
    });

    it('exige o escopo correto da banda ao consultar por id', async () => {
      await expect(
        repositories.songs.findById('band-1', 'song-1'),
      ).resolves.toBe(songs[0]);
      await expect(
        repositories.songs.findById('band-2', 'song-1'),
      ).resolves.toBeNull();
    });
  });

  describe('shows', () => {
    it('lista somente os shows da banda informada', async () => {
      await expect(repositories.shows.listByBandId('band-1')).resolves.toEqual([
        shows[0],
      ]);
      await expect(repositories.shows.listByBandId('unknown')).resolves.toEqual(
        [],
      );
    });

    it('exige o escopo correto da banda ao consultar por id', async () => {
      await expect(
        repositories.shows.findById('band-2', 'show-2'),
      ).resolves.toBe(shows[1]);
      await expect(
        repositories.shows.findById('band-1', 'show-2'),
      ).resolves.toBeNull();
    });
  });
});
