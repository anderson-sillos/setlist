import { fireEvent, render } from '@testing-library/react-native';

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
        label="Ordenar"
        onChange={onChange}
        options={options}
        value="title"
      />,
    );
    const trigger = view.getByLabelText('Alterar ordenação');

    expect(trigger.props.accessibilityValue).toEqual({ text: 'Título' });

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
    const view = await render(
      <FilterMenu
        accessibilityLabel="Abrir filtros"
        label="Filtros"
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

    const scrim = view.getByLabelText('Fechar filtros');

    expect(scrim.children).toHaveLength(0);

    await fireEvent.press(view.getByLabelText('Artista'));

    expect(onChange).toHaveBeenCalledWith('artist');
    expect(view.getByLabelText('Aplicar filtros')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Aplicar filtros'));

    expect(view.queryByLabelText('Fechar filtros')).toBeNull();
  });
});
