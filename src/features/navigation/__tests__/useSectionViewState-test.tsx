import {
  act,
  fireEvent,
  render,
  renderHook,
} from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { demoIds } from '@/data/demo';
import {
  NavigationMemoryProvider,
  useNavigationMemory,
} from '@/features/navigation/NavigationMemory';
import { useSectionViewState } from '@/features/navigation/useSectionViewState';

describe('useSectionViewState', () => {
  it('restaura a rolagem apenas na montagem e preserva a memória para o próximo acesso', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NavigationMemoryProvider>{children}</NavigationMemoryProvider>
    );
    const { result, rerender } = await renderHook(
      () => {
        const memory = useNavigationMemory();
        const view = useSectionViewState(demoIds.primaryBand, 'shows', {
          search: '',
        });
        return { memory, view };
      },
      { wrapper },
    );
    expect(result.current.view.initialScrollOffset).toBe(0);

    await act(() => {
      result.current.view.rememberScrollOffset(420);
      result.current.view.update('search', 'show');
    });
    await rerender(undefined);

    expect(result.current.view.initialScrollOffset).toBe(0);
    expect(result.current.view.state.search).toBe('show');
    expect(
      result.current.memory.getSectionMemory(demoIds.primaryBand, 'shows'),
    ).toEqual({ scrollOffset: 420, viewState: { search: 'show' } });
  });
  it('restaura a última posição ao montar a seção novamente', async () => {
    function Section() {
      const { initialScrollOffset, rememberScrollOffset } = useSectionViewState(
        demoIds.primaryBand,
        'repertoire',
        { search: '' },
      );
      return (
        <Pressable onPress={() => rememberScrollOffset(420)}>
          <Text>{initialScrollOffset}</Text>
        </Pressable>
      );
    }
    const screen = (mounted: boolean) => (
      <NavigationMemoryProvider>
        {mounted ? <Section /> : null}
      </NavigationMemoryProvider>
    );
    const view = await render(screen(true));
    await fireEvent.press(view.getByText('0'));
    await view.rerender(screen(false));
    await view.rerender(screen(true));
    expect(view.getByText('420')).toBeTruthy();
  });
});
