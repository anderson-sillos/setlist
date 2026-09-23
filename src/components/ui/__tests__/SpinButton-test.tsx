import { fireEvent, render } from '@testing-library/react-native';

import { SpinButton } from '@/components/ui/SpinButton';

describe('<SpinButton />', () => {
  it('incrementa e decrementa o valor pelos controles acessíveis', async () => {
    const onChangeText = jest.fn();
    const view = await render(
      <SpinButton
        accessibilityLabel="Minutos da duração"
        decrementLabel="Diminuir minutos"
        incrementLabel="Aumentar minutos"
        max={59}
        onChangeText={onChangeText}
        value="2"
      />,
    );

    expect(
      view.getByLabelText('Minutos da duração').props.selectTextOnFocus,
    ).toBe(true);

    await fireEvent.press(view.getByLabelText('Aumentar minutos'));
    await fireEvent.press(view.getByLabelText('Diminuir minutos'));

    expect(onChangeText).toHaveBeenNthCalledWith(1, '3');
    expect(onChangeText).toHaveBeenNthCalledWith(2, '1');
  });

  it('não diminui um campo vazio e começa em um ao incrementar', async () => {
    const onChangeText = jest.fn();
    const view = await render(
      <SpinButton
        accessibilityLabel="Horas da duração"
        onChangeText={onChangeText}
        value=""
      />,
    );

    await fireEvent.press(view.getByLabelText('Diminuir valor'));
    await fireEvent.press(view.getByLabelText('Aumentar valor'));

    expect(onChangeText).toHaveBeenCalledTimes(1);
    expect(onChangeText).toHaveBeenCalledWith('1');
  });
});
