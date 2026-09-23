import { useState } from 'react';
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

    expect(view.getByLabelText('Minutos da duração').props.onFocus).toEqual(
      expect.any(Function),
    );

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

  it('mantém o campo vazio durante a edição mesmo se o pai normalizar para zero', async () => {
    const onChangeText = jest.fn();
    function ControlledSpinButton() {
      const [value, setValue] = useState('45');

      return (
        <SpinButton
          accessibilityLabel="Segundos da duração"
          max={59}
          maxLength={2}
          onChangeText={(nextValue) => {
            onChangeText(nextValue);
            setValue(nextValue || '0');
          }}
          value={value}
        />
      );
    }

    const view = await render(<ControlledSpinButton />);
    const input = view.getByLabelText('Segundos da duração');

    await fireEvent(input, 'focus');
    await fireEvent.changeText(input, '');
    await fireEvent.changeText(input, '2');
    await fireEvent.changeText(input, '23');

    expect(onChangeText).toHaveBeenNthCalledWith(1, '');
    expect(onChangeText).toHaveBeenNthCalledWith(2, '2');
    expect(onChangeText).toHaveBeenNthCalledWith(3, '23');
    expect(view.getByLabelText('Segundos da duração').props.value).toBe('23');
  });
});
