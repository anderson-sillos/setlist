import { fireEvent, render } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { ListControlsOverlay } from '@/components/ui/ListControlsOverlay';

describe('<ListControlsOverlay />', () => {
  it('preserva o espaço da lista e a busca ao recolher os controles', async () => {
    const onExpandedHeightChange = jest.fn();
    const controls = (controlsVisible: boolean) => (
      <ListControlsOverlay
        controlsVisible={controlsVisible}
        horizontalPadding={16}
        onExpandedHeightChange={onExpandedHeightChange}
        search={<Text>Buscar música</Text>}
      >
        <Pressable accessibilityLabel="Filtros" accessibilityRole="button">
          <Text>Filtros</Text>
        </Pressable>
      </ListControlsOverlay>
    );
    const view = await render(controls(true));

    await fireEvent(view.getByTestId('list-controls-search'), 'layout', {
      nativeEvent: { layout: { height: 72 } },
    });
    await fireEvent(view.getByTestId('list-controls-toolbar'), 'layout', {
      nativeEvent: { layout: { height: 48 } },
    });
    expect(onExpandedHeightChange).toHaveBeenLastCalledWith(121);
    onExpandedHeightChange.mockClear();

    await view.rerender(controls(false));
    expect(onExpandedHeightChange).not.toHaveBeenCalled();
    expect(view.getByText('Buscar música')).toBeTruthy();
    expect(view.queryByRole('button', { name: 'Filtros' })).toBeNull();
    expect(
      view.getByText('Filtros', { includeHiddenElements: true }),
    ).toBeTruthy();

    await view.rerender(controls(true));
    expect(onExpandedHeightChange).not.toHaveBeenCalled();
    expect(view.getByRole('button', { name: 'Filtros' })).toBeTruthy();
  });
});
