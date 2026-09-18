import { renderHook } from '@testing-library/react-native';

import { demoIds } from '@/data/demo';
import {
  NavigationMemoryProvider,
  useNavigationMemory,
} from '@/features/navigation/NavigationMemory';

describe('memória de navegação', () => {
  it('preserva a última rota e rolagem de cada seção', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NavigationMemoryProvider>{children}</NavigationMemoryProvider>
    );
    const { result } = await renderHook(() => useNavigationMemory(), {
      wrapper,
    });

    result.current.rememberRoute(
      demoIds.primaryBand,
      'repertoire',
      '/bands/demo/repertoire/song-1',
    );
    result.current.rememberScrollOffset(demoIds.primaryBand, 'repertoire', 248);
    result.current.rememberScrollOffset(demoIds.primaryBand, 'shows', -20);
    result.current.rememberViewState(demoIds.primaryBand, 'repertoire', {
      filter: 'pending',
      search: 'luzes',
      sort: 'title',
    });

    expect(
      result.current.getSectionMemory(demoIds.primaryBand, 'repertoire'),
    ).toEqual({
      route: '/bands/demo/repertoire/song-1',
      scrollOffset: 248,
      viewState: {
        filter: 'pending',
        search: 'luzes',
        sort: 'title',
      },
    });
    expect(
      result.current.getSectionMemory(demoIds.primaryBand, 'shows'),
    ).toEqual({ scrollOffset: 0 });
  });
});
