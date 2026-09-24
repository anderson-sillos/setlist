import { getSupabaseClient } from '@/data/supabase/client';
import {
  createSong,
  SongMutationError,
  updateSong,
  type SongWriteInput,
} from '@/data/supabase/songMutations';

jest.mock('@/data/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

const mockGetSupabaseClient = jest.mocked(getSupabaseClient);

const validSong: SongWriteInput = {
  bpm: 120,
  estimatedDurationMs: 180000,
  musicalKey: 'G',
  notes: 'Observação',
  originalArtist: 'Artista original',
  title: '  Música nova  ',
  youtubeReference: 'https://youtu.be/abc123',
};

const validLyrics = {
  blocks: [
    {
      id: 'verse',
      name: 'Verso',
      lines: [
        { id: 'line-1', text: 'Primeira linha', startTimeMs: null },
        { id: 'line-2', text: 'Segunda linha', startTimeMs: null },
      ],
    },
  ],
};

type MutationQueryMock = {
  eq: jest.Mock<MutationQueryMock, [string, string]>;
  insert: jest.Mock<MutationQueryMock, [unknown]>;
  maybeSingle: jest.Mock<Promise<{ data: unknown; error: unknown }>, []>;
  select: jest.Mock<MutationQueryMock, [string]>;
  single: jest.Mock<Promise<{ data: unknown; error: unknown }>, []>;
  update: jest.Mock<MutationQueryMock, [unknown]>;
};

function createMutationQuery(result: { data: unknown; error: unknown }) {
  const query = {} as MutationQueryMock;
  query.eq = jest.fn<MutationQueryMock, [string, string]>(() => query);
  query.insert = jest.fn<MutationQueryMock, [unknown]>(() => query);
  query.maybeSingle = jest.fn<Promise<{ data: unknown; error: unknown }>, []>(
    () => Promise.resolve(result),
  );
  query.select = jest.fn<MutationQueryMock, [string]>(() => query);
  query.single = jest.fn<Promise<{ data: unknown; error: unknown }>, []>(() =>
    Promise.resolve(result),
  );
  query.update = jest.fn<MutationQueryMock, [unknown]>(() => query);

  return query;
}

describe('mutations de músicas no Supabase', () => {
  const from = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSupabaseClient.mockReturnValue({ from } as never);
  });

  it('valida, normaliza e cria a música no escopo da banda', async () => {
    const query = createMutationQuery({
      data: { id: 'song-new', updated_at: '2026-09-24T12:00:00.000Z' },
      error: null,
    });
    from.mockReturnValue(query);

    await expect(
      createSong({ bandId: 'band-real', song: validSong }),
    ).resolves.toBe('song-new');

    expect(from).toHaveBeenCalledWith('songs');
    expect(query.insert).toHaveBeenCalledWith({
      band_id: 'band-real',
      bpm: 120,
      estimated_duration_ms: 180000,
      musical_key: 'G',
      notes: 'Observação',
      original_artist: 'Artista original',
      title: 'Música nova',
      youtube_reference: 'https://youtu.be/abc123',
    });
    expect(query.select).toHaveBeenCalledWith('id, updated_at');
  });

  it('exige o horário de atualização gerado pelo servidor', async () => {
    const createQueryWithoutTimestamp = createMutationQuery({
      data: { id: 'song-new' },
      error: null,
    });
    from.mockReturnValueOnce(createQueryWithoutTimestamp);

    await expect(
      createSong({ bandId: 'band-real', song: validSong }),
    ).rejects.toMatchObject({ code: 'request_failed' });

    const updateQueryWithInvalidTimestamp = createMutationQuery({
      data: { id: 'song-real', updated_at: 'não é uma data' },
      error: null,
    });
    from.mockReturnValueOnce(updateQueryWithInvalidTimestamp);

    await expect(
      updateSong({ bandId: 'band-real', song: validSong, songId: 'song-real' }),
    ).rejects.toMatchObject({ code: 'request_failed' });
  });

  it('rejeita título, BPM, duração e referência inválidos antes de acessar o banco', async () => {
    const invalidInputs: SongWriteInput[] = [
      { ...validSong, title: '   ' },
      { ...validSong, bpm: 1001 },
      { ...validSong, estimatedDurationMs: -1 },
      { ...validSong, youtubeReference: 'javascript:alert(1)' },
      { ...validSong, youtubeReference: 'https://example.com/video' },
    ];

    for (const song of invalidInputs) {
      await expect(
        createSong({ bandId: 'band-real', song }),
      ).rejects.toBeInstanceOf(SongMutationError);
    }

    expect(from).not.toHaveBeenCalled();
  });

  it('atualiza somente a música da banda informada', async () => {
    const query = createMutationQuery({
      data: { id: 'song-real', updated_at: '2026-09-24T12:00:00.000Z' },
      error: null,
    });
    from.mockReturnValue(query);

    await expect(
      updateSong({ bandId: 'band-real', song: validSong, songId: 'song-real' }),
    ).resolves.toBeUndefined();
    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Música nova' }),
    );
    expect(query.eq).toHaveBeenNthCalledWith(1, 'band_id', 'band-real');
    expect(query.eq).toHaveBeenNthCalledWith(2, 'id', 'song-real');
  });

  it('grava a letra estruturada e o estado derivado em uma única atualização', async () => {
    const query = createMutationQuery({
      data: { id: 'song-real', updated_at: '2026-09-24T12:00:00.000Z' },
      error: null,
    });
    from.mockReturnValue(query);

    await expect(
      updateSong({
        bandId: 'band-real',
        lyrics: validLyrics,
        song: validSong,
        songId: 'song-real',
      }),
    ).resolves.toBeUndefined();

    expect(query.update).toHaveBeenCalledTimes(1);
    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({
        lyrics: validLyrics,
        lyric_status: 'static',
        title: 'Música nova',
      }),
    );
    expect(query.eq).toHaveBeenNthCalledWith(1, 'band_id', 'band-real');
    expect(query.eq).toHaveBeenNthCalledWith(2, 'id', 'song-real');
  });

  it('inclui a letra e seu estado derivado ao criar a música', async () => {
    const query = createMutationQuery({
      data: { id: 'song-new', updated_at: '2026-09-24T12:00:00.000Z' },
      error: null,
    });
    from.mockReturnValue(query);

    await createSong({
      bandId: 'band-real',
      lyrics: validLyrics,
      song: validSong,
    });

    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        lyrics: validLyrics,
        lyric_status: 'static',
      }),
    );
  });

  it('rejeita identificadores duplicados antes da chamada ao Supabase', async () => {
    const duplicateIds = {
      blocks: [
        {
          id: 'same-block',
          name: null,
          lines: [{ id: 'same-line', text: 'Uma', startTimeMs: null }],
        },
        {
          id: 'same-block',
          name: null,
          lines: [{ id: 'same-line', text: 'Duas', startTimeMs: null }],
        },
      ],
    };

    await expect(
      updateSong({
        bandId: 'band-real',
        lyrics: duplicateIds,
        song: validSong,
        songId: 'song-real',
      }),
    ).rejects.toMatchObject({ code: 'invalid_song' });
    expect(from).not.toHaveBeenCalled();
  });

  it('mapeia falta de permissão e ausência da música em mensagens seguras', async () => {
    const deniedQuery = createMutationQuery({
      data: null,
      error: { code: '42501', message: 'permission denied' },
    });
    from.mockReturnValueOnce(deniedQuery);
    await expect(
      createSong({ bandId: 'band-real', song: validSong }),
    ).rejects.toMatchObject({ code: 'permission_denied' });

    const missingQuery = createMutationQuery({ data: null, error: null });
    from.mockReturnValueOnce(missingQuery);
    await expect(
      updateSong({ bandId: 'band-real', song: validSong, songId: 'missing' }),
    ).rejects.toMatchObject({ code: 'not_found_or_forbidden' });
  });
});
