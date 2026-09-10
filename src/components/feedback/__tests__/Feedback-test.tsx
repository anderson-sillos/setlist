import { act, fireEvent, render } from '@testing-library/react-native';

import {
  ConnectionBanner,
  ErrorFeedback,
  feedbackMessages,
  getFeedbackMessage,
  isSensitiveFeedback,
  LoadingFeedback,
  TemporaryFeedback,
  UnavailableFeedback,
} from '@/components/feedback';

describe('feedback compartilhado', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('mostra esqueleto e mantém a variação escolhida no carregamento', async () => {
    const view = await render(<LoadingFeedback variation={1} />);

    expect(
      view.getByRole('progressbar', { name: 'Preparando o palco…' }),
    ).toBeTruthy();
    expect(view.getByTestId('feedback-loading')).toBeTruthy();
  });

  it('oferece uma nova tentativa para erro recuperável', async () => {
    const onRetry = jest.fn();
    const view = await render(
      <ErrorFeedback onRetry={onRetry} variation={1} />,
    );

    expect(view.getByRole('alert')).toBeTruthy();
    expect(view.getByText(/O palco perdeu o sinal/)).toBeTruthy();
    await fireEvent.press(
      view.getByRole('button', { name: 'Tentar novamente' }),
    );
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('usa texto direto e sem variação cômica para indisponibilidade sensível', async () => {
    const view = await render(<UnavailableFeedback />);

    expect(view.getByTestId('feedback-unavailable')).toBeTruthy();
    expect(view.getByText(/não possui autorização/)).toBeTruthy();
    expect(isSensitiveFeedback('content-unavailable')).toBe(true);
    expect(isSensitiveFeedback('load-error')).toBe(false);
  });

  it('comunica perda e retorno de conexão por texto', async () => {
    const onRetry = jest.fn();
    const requiredView = await render(
      <ConnectionBanner onRetry={onRetry} status="required" />,
    );

    expect(requiredView.getByRole('alert')).toBeTruthy();
    expect(requiredView.getByText(/Reconecte para continuar/)).toBeTruthy();
    await fireEvent.press(
      requiredView.getByRole('button', { name: 'Tentar novamente' }),
    );
    expect(onRetry).toHaveBeenCalledTimes(1);
    await requiredView.unmount();

    const offlineView = await render(
      <ConnectionBanner status="offline-available" />,
    );
    expect(
      offlineView.getByText(/continua com o que já foi carregado/),
    ).toBeTruthy();
    await offlineView.unmount();

    const restoredView = await render(
      <ConnectionBanner status="restored" variation={1} />,
    );
    expect(
      restoredView.getByText('Conexão de volta. Podemos continuar.'),
    ).toBeTruthy();
  });

  it('fecha automaticamente uma confirmação temporária', async () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    const view = await render(
      <TemporaryFeedback
        durationMs={2_000}
        messageKey="save-success"
        onDismiss={onDismiss}
      />,
    );

    expect(view.getByTestId('temporary-feedback')).toBeTruthy();
    await act(() => jest.advanceTimersByTime(2_000));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('mantém ação objetiva para uma remoção reversível', async () => {
    const onAction = jest.fn();
    const onDismiss = jest.fn();
    const view = await render(
      <TemporaryFeedback
        actionLabel="Desfazer"
        durationMs={0}
        messageKey="item-removed"
        onAction={onAction}
        onDismiss={onDismiss}
      />,
    );

    await fireEvent.press(view.getByRole('button', { name: 'Desfazer' }));
    await fireEvent.press(
      view.getByRole('button', { name: 'Fechar mensagem' }),
    );
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('resolve variações controladas sem aleatoriedade', () => {
    expect(getFeedbackMessage('loading', 0)).toBe('Afinando os instrumentos…');
    expect(getFeedbackMessage('loading', 1)).toBe('Preparando o palco…');
    expect(getFeedbackMessage('loading', 3)).toBe('Preparando o palco…');
    expect(getFeedbackMessage('loading', -1)).toBe('Preparando o palco…');

    for (const key of Object.keys(
      feedbackMessages,
    ) as (keyof typeof feedbackMessages)[]) {
      expect(getFeedbackMessage(key)).toEqual(expect.any(String));
    }
  });
});
