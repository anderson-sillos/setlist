import { act, fireEvent, render } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { UnsavedChangesPrompt } from '@/components/feedback/UnsavedChangesPrompt';

function getNativeDismiss(view: Awaited<ReturnType<typeof render>>) {
  let parent = view.getByTestId('unsaved-changes-prompt').parent;
  while (parent && typeof parent.props.onDismiss !== 'function') {
    parent = parent.parent;
  }
  if (!parent) throw new Error('Modal da confirmação não encontrado');
  return parent.props.onDismiss as () => void;
}

describe('UnsavedChangesPrompt', () => {
  const originalPlatform = Platform.OS;

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: originalPlatform });
  });

  it('no iOS espera o fechamento nativo antes de descartar o formulário ou navegar', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios' });
    const onDiscard = jest.fn();
    const onContinue = jest.fn();
    const view = await render(
      <UnsavedChangesPrompt
        onContinue={onContinue}
        onDiscard={onDiscard}
        visible
      />,
    );

    const dismiss = getNativeDismiss(view);
    await fireEvent.press(view.getByLabelText('Descartar alterações'));

    expect(view.queryByText('Descartar alterações?')).toBeNull();
    expect(onDiscard).not.toHaveBeenCalled();
    expect(onContinue).not.toHaveBeenCalled();

    await act(() => dismiss());
    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(view.queryByText('Descartar alterações?')).toBeNull();

    await act(() => dismiss());
    expect(onDiscard).toHaveBeenCalledTimes(1);

    await view.rerender(
      <UnsavedChangesPrompt
        onContinue={onContinue}
        onDiscard={onDiscard}
        visible={false}
      />,
    );
    await view.rerender(
      <UnsavedChangesPrompt
        onContinue={onContinue}
        onDiscard={onDiscard}
        visible
      />,
    );
    expect(view.getByText('Descartar alterações?')).toBeTruthy();
  });

  it('continuar editando não executa o descarte ao fechar o modal no iOS', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios' });
    const onDiscard = jest.fn();
    const onContinue = jest.fn();
    const view = await render(
      <UnsavedChangesPrompt
        onContinue={onContinue}
        onDiscard={onDiscard}
        visible
      />,
    );

    const dismiss = getNativeDismiss(view);
    await fireEvent.press(view.getByText('Continuar editando'));
    await act(() => dismiss());

    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onDiscard).not.toHaveBeenCalled();
  });

  it.each(['android', 'web'] as const)(
    'mantém o descarte imediato em %s',
    async (platform) => {
      Object.defineProperty(Platform, 'OS', { value: platform });
      const onDiscard = jest.fn();
      const view = await render(
        <UnsavedChangesPrompt
          onContinue={jest.fn()}
          onDiscard={onDiscard}
          visible
        />,
      );

      await fireEvent.press(view.getByLabelText('Descartar alterações'));

      expect(onDiscard).toHaveBeenCalledTimes(1);
    },
  );
});
