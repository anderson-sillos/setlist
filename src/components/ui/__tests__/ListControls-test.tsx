import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { OptionSheet } from '@/components/ui/list-controls/OptionSheet';
import {
  ChoiceChips,
  FilterMenu,
  OptionMenu,
  SearchField,
} from '@/components/ui/ListControls';

const options = [
  { label: 'Título', value: 'title' },
  { label: 'Artista', value: 'artist' },
] as const;

describe('<SearchField />', () => {
  it('mostra a limpeza somente quando há texto e solicita o valor vazio', async () => {
    const onChangeText = jest.fn();
    const view = await render(
      <SearchField
        accessibilityLabel="Buscar música"
        onChangeText={onChangeText}
        placeholder="Buscar"
        value=""
      />,
    );

    expect(view.queryByLabelText('Limpar busca')).toBeNull();

    await view.rerender(
      <SearchField
        accessibilityLabel="Buscar música"
        onChangeText={onChangeText}
        placeholder="Buscar"
        value="Luzes"
      />,
    );

    const clearButton = view.getByLabelText('Limpar busca');

    expect(clearButton.props.hitSlop).toBe(14);

    await fireEvent.press(clearButton);

    expect(onChangeText).toHaveBeenCalledWith('');
  });
});

describe('<OptionSheet />', () => {
  it('exibe um botão X no cabeçalho por padrão', async () => {
    const onClose = jest.fn();
    const view = await render(
      <OptionSheet
        closeAccessibilityLabel="Fechar seleção de músicas"
        label="Adicionar músicas"
        onClose={onClose}
        sheetStyle={{ height: 520, maxHeight: '90%' }}
        testID="sized-option-sheet"
        visible
      >
        <></>
      </OptionSheet>,
    );
    expect(
      StyleSheet.flatten(view.getByTestId('sized-option-sheet').props.style),
    ).toMatchObject({ height: 520, maxHeight: '90%' });

    await fireEvent.press(view.getByLabelText('Fechar seleção de músicas'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('<ChoiceChips />', () => {
  it('informa a opção selecionada e solicita a troca', async () => {
    const onChange = jest.fn();
    const view = await render(
      <ChoiceChips
        accessibilityLabel="Visualização"
        onChange={onChange}
        options={options}
        value="title"
      />,
    );

    expect(view.getByLabelText('Título').props.accessibilityState).toEqual({
      checked: true,
    });
    expect(view.getByLabelText('Artista').props.accessibilityState).toEqual({
      checked: false,
    });

    await fireEvent.press(view.getByLabelText('Artista'));

    expect(onChange).toHaveBeenCalledWith('artist');
  });
});

describe('<OptionMenu />', () => {
  it('abre as opções, informa o valor atual e fecha após a seleção', async () => {
    const onChange = jest.fn();
    const view = await render(
      <OptionMenu
        accessibilityLabel="Alterar ordenação"
        icon="sort"
        label="Ordenar"
        onChange={onChange}
        options={options}
        value="title"
      />,
    );
    const trigger = view.getByLabelText('Alterar ordenação');

    expect(trigger.props.accessibilityValue).toEqual({ text: 'Título' });
    expect(trigger.props.accessibilityState?.selected).toBeUndefined();

    await view.rerender(
      <OptionMenu
        active
        accessibilityLabel="Alterar ordenação"
        icon="sort"
        label="Ordenar"
        onChange={onChange}
        options={options}
        value="title"
      />,
    );

    expect(
      view.getByLabelText('Alterar ordenação').props.accessibilityState,
    ).toEqual({ selected: true });

    await fireEvent.press(trigger);

    expect(view.getByLabelText('Fechar opções')).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Fechar opções'));
    expect(view.queryByLabelText('Fechar opções')).toBeNull();

    await fireEvent.press(trigger);

    expect(view.getByLabelText('Título').props.accessibilityState).toEqual({
      checked: true,
    });

    await fireEvent.press(view.getByLabelText('Artista'));

    expect(onChange).toHaveBeenCalledWith('artist');
    expect(view.queryByLabelText('Fechar opções')).toBeNull();
  });
});

describe('<FilterMenu />', () => {
  it('mantém o painel aberto durante a seleção e separa o fundo dos controles', async () => {
    const onChange = jest.fn();
    const onClear = jest.fn();
    const view = await render(
      <FilterMenu
        accessibilityLabel="Abrir filtros"
        icon="filter"
        label="Filtros"
        onClear={onClear}
        summary="1"
      >
        <ChoiceChips
          accessibilityLabel="Filtros disponíveis"
          onChange={onChange}
          options={options}
          value="title"
        />
      </FilterMenu>,
    );

    expect(view.getByText('Filtros: 1')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Abrir filtros'));

    const scrim = view.getByLabelText('Fechar filtros tocando fora');

    expect(scrim.children).toHaveLength(0);
    expect(view.getByLabelText('Fechar filtros')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Artista'));

    expect(onChange).toHaveBeenCalledWith('artist');
    expect(view.getByLabelText('Aplicar filtros')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Limpar filtros'));

    expect(onClear).toHaveBeenCalledTimes(1);
    expect(view.queryByLabelText('Fechar filtros tocando fora')).toBeNull();
  });
});
