import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useQueryClient } from '@tanstack/react-query';

import { invalidateBandReadData } from '@/data/queryInvalidations';
import { useBandContext } from '@/data/queries';
import { createBand, createBandMember } from '@/testing/factories';
import { createInMemoryRepositories } from '@/testing/repositories';
import { TestAppProviders as AppProviders } from '@/testing/TestAppProviders';

const bandId = 'band-context-query-test';
const userId = 'user-context-query-test';

function createRepositories() {
  return createInMemoryRepositories({
    bands: [createBand({ id: bandId })],
    bandMembers: [createBandMember({ bandId, role: 'owner', userId })],
    songs: [],
    shows: [],
  });
}

describe('consulta de contexto da banda', () => {
  it('compartilha a leitura entre consumidores e atualiza o papel após invalidação', async () => {
    const repositories = createRepositories();
    let role: 'owner' | 'editor' | 'member' = 'owner';
    const getContext = jest
      .spyOn(repositories.bands, 'getContext')
      .mockImplementation(async (_userId, requestedBandId) => ({
        bandId: requestedBandId,
        bandName: 'Banda de contexto',
        hasActiveSongs: true,
        role,
      }));

    const { result } = await renderHook(
      () => ({
        first: useBandContext(bandId),
        queryClient: useQueryClient(),
        second: useBandContext(bandId),
      }),
      {
        wrapper: ({ children }) => (
          <AppProviders currentUserId={userId} repositories={repositories}>
            {children}
          </AppProviders>
        ),
      },
    );

    await waitFor(() => {
      expect(result.current.first.data?.role).toBe('owner');
      expect(result.current.second.data?.bandName).toBe('Banda de contexto');
    });
    expect(getContext).toHaveBeenCalledTimes(1);

    role = 'member';
    await act(async () => {
      await invalidateBandReadData(result.current.queryClient, {
        bandId,
        type: 'membership',
      });
    });

    await waitFor(() => {
      expect(result.current.first.data?.role).toBe('member');
      expect(result.current.second.data?.role).toBe('member');
    });
    expect(getContext).toHaveBeenCalledTimes(2);
  });
});
