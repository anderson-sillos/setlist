import { renderHook } from '@testing-library/react-native';

import {
  NavigationMemoryProvider,
  useNavigationMemory,
} from '@/features/navigation/NavigationMemory';

const BAND_ID = 'band-navigation-memory-test';

describe('memória de navegação', () => {
  it('preserva a última rota e rolagem de cada seção', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NavigationMemoryProvider>{children}</NavigationMemoryProvider>
    );
    const { result } = await renderHook(() => useNavigationMemory(), {
      wrapper,
    });

    result.current.rememberRoute(
      BAND_ID,
      'repertoire',
      `/bands/${BAND_ID}/repertoire/song-1`,
    );
    result.current.rememberScrollOffset(BAND_ID, 'repertoire', 248);
    result.current.rememberScrollOffset(BAND_ID, 'shows', -20);
    result.current.rememberViewState(BAND_ID, 'repertoire', {
      filter: 'pending',
      search: 'luzes',
      sort: 'title',
    });

    expect(result.current.getSectionMemory(BAND_ID, 'repertoire')).toEqual({
      route: `/bands/${BAND_ID}/repertoire/song-1`,
      scrollOffset: 248,
      viewState: {
        filter: 'pending',
        search: 'luzes',
        sort: 'title',
      },
    });
    expect(result.current.getSectionMemory(BAND_ID, 'shows')).toEqual({
      scrollOffset: 0,
    });
  });
});
