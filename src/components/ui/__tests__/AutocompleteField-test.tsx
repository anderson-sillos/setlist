import { fireEvent, render } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { AutocompleteField } from '@/components/ui/AutocompleteField';

describe('<AutocompleteField />', () => {
  it('filtra as bandas e preenche o campo ao selecionar uma sugestão', async () => {
    const onChangeText = jest.fn();
    const view = await render(
      <AutocompleteField
        accessibilityLabel="Artista/Banda"
        label="Artista/Banda"
        onChangeText={onChangeText}
        options={['Banda Horizonte', 'Trio Aurora', 'Trio Auroras']}
        placeholder="Ex.: Artista original"
        value="aur"
      />,
    );

    await fireEvent(view.getByLabelText('Artista/Banda'), 'focus');

    expect(view.getByLabelText('Usar Trio Aurora')).toBeTruthy();
    expect(view.queryByLabelText('Usar Banda Horizonte')).toBeNull();

    await fireEvent.press(view.getByLabelText('Usar Trio Aurora'));

    expect(onChangeText).toHaveBeenCalledWith('Trio Aurora');
  });

  it('mantém o campo focalizável no Android', async () => {
    const originalPlatform = Platform.OS;
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'android',
    });

    try {
      const view = await render(
        <AutocompleteField
          accessibilityLabel="Artista/Banda"
          label="Artista/Banda"
          onChangeText={jest.fn()}
          options={['Banda Horizonte', 'Trio Aurora']}
          placeholder="Ex.: Artista original"
          value="aur"
        />,
      );

      await fireEvent(view.getByLabelText('Artista/Banda'), 'focus');

      expect(view.getByLabelText('Artista/Banda')).toBeTruthy();
    } finally {
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: originalPlatform,
      });
    }
  });

  it('seleciona a sugestão no início do clique para o web', async () => {
    const originalPlatform = Platform.OS;
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'web',
    });

    const onChangeText = jest.fn();
    const view = await render(
      <AutocompleteField
        accessibilityLabel="Artista/Banda"
        label="Artista/Banda"
        onChangeText={onChangeText}
        options={['Banda Horizonte', 'Trio Aurora']}
        placeholder="Ex.: Artista original"
        value="aur"
      />,
    );

    await fireEvent(view.getByLabelText('Artista/Banda'), 'focus');
    await fireEvent(view.getByLabelText('Usar Trio Aurora'), 'pressIn');

    expect(onChangeText).toHaveBeenCalledWith('Trio Aurora');

    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: originalPlatform,
    });
  });

  it('permite selecionar uma sugestão mesmo quando o campo perde o foco', async () => {
    const onChangeText = jest.fn();
    const view = await render(
      <AutocompleteField
        accessibilityLabel="Artista/Banda"
        label="Artista/Banda"
        onChangeText={onChangeText}
        options={['Banda Horizonte', 'Trio Aurora', 'Trio Auroras']}
        placeholder="Ex.: Artista original"
        value="aur"
      />,
    );

    const input = view.getByLabelText('Artista/Banda');
    await fireEvent(input, 'focus');
    await fireEvent(input, 'blur');
    await fireEvent.press(view.getByLabelText('Usar Trio Aurora'));

    expect(onChangeText).toHaveBeenCalledWith('Trio Aurora');
  });

  it('não exibe a lista quando a única sugestão já está preenchida', async () => {
    const view = await render(
      <AutocompleteField
        accessibilityLabel="Artista/Banda"
        label="Artista/Banda"
        onChangeText={jest.fn()}
        options={['Trio Aurora']}
        placeholder="Ex.: Artista original"
        value="Trio Aurora"
      />,
    );

    await fireEvent(view.getByLabelText('Artista/Banda'), 'focus');

    expect(view.queryByLabelText('Usar Trio Aurora')).toBeNull();
  });

  it('exibe a única sugestão quando ela é diferente do valor preenchido', async () => {
    const view = await render(
      <AutocompleteField
        accessibilityLabel="Artista/Banda"
        label="Artista/Banda"
        onChangeText={jest.fn()}
        options={['Trio Aurora']}
        placeholder="Ex.: Artista original"
        value="aur"
      />,
    );

    await fireEvent(view.getByLabelText('Artista/Banda'), 'focus');

    expect(view.getByLabelText('Usar Trio Aurora')).toBeTruthy();
  });

  it('não exibe a lista quando não existem sugestões', async () => {
    const view = await render(
      <AutocompleteField
        accessibilityLabel="Artista/Banda"
        label="Artista/Banda"
        onChangeText={jest.fn()}
        options={[]}
        placeholder="Ex.: Artista original"
        value="aur"
      />,
    );

    await fireEvent(view.getByLabelText('Artista/Banda'), 'focus');

    expect(view.queryByLabelText(/Usar /)).toBeNull();
  });
});
