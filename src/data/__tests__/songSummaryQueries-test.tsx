import { renderHook, waitFor } from '@testing-library/react-native';
import { useQueryClient } from '@tanstack/react-query';

import { useSong, useUserRepertoireSongSummaries } from '@/data/queries';
import { queryKeys } from '@/data/queryKeys';
import { createBandScenario } from '@/testing/scenarios';
import { createLyricsForStatus, createSong } from '@/testing/factories';
import { TestAppProviders } from '@/testing/TestAppProviders';

const bandId = 'band-song-summary-query';
const userId = 'user-song-summary-query';
const song = createSong({
  bandId,
  id: 'song-summary-query',
  lyrics: createLyricsForStatus('static'),
  lyricStatus: 'static',
  title: 'Canção completa',
});

describe('consultas de resumo e documento completo de música', () => {
  it('usa resumos para sugestões e busca a letra completa por ID sob demanda', async () => {
    const repositories = createBandScenario({
      bandId,
      role: 'owner',
      songs: [song],
      userId,
    }).repositories;
    const listUserBandSummaries = jest.spyOn(
      repositories.bands,
      'listUserSummaries',
    );
    const listUserBands = jest.spyOn(repositories.bands, 'listForUser');
    const listSongSummaries = jest.spyOn(
      repositories.songs,
      'listSummariesByBandId',
    );
    const listSongDocuments = jest.spyOn(repositories.songs, 'listByBandId');
    const findSongById = jest.spyOn(repositories.songs, 'findById');
    const { result } = await renderHook(
      () => ({
        queryClient: useQueryClient(),
        song: useSong(bandId, song.id),
        suggestions: useUserRepertoireSongSummaries(),
      }),
      {
        wrapper: ({ children }) => (
          <TestAppProviders currentUserId={userId} repositories={repositories}>
            {children}
          </TestAppProviders>
        ),
      },
    );

    await waitFor(() => {
      expect(result.current.song.data?.lyrics).toEqual(song.lyrics);
      expect(result.current.suggestions.data?.[0].title).toBe(song.title);
    });

    expect(listUserBandSummaries).toHaveBeenCalledTimes(1);
    expect(listUserBands).not.toHaveBeenCalled();
    expect(listSongSummaries).toHaveBeenCalledWith(bandId);
    expect(listSongDocuments).not.toHaveBeenCalled();
    expect(findSongById).toHaveBeenCalledWith(bandId, song.id);
    expect(
      result.current.queryClient.getQueryData(
        queryKeys.songs.summariesForUser(userId),
      ),
    ).toEqual([expect.objectContaining({ title: song.title })]);
    expect(
      result.current.queryClient.getQueryData(
        queryKeys.songs.documentById(bandId, song.id),
      ),
    ).toEqual(song);
  });
});
