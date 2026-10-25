import { act, renderHook } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

import {
  formatElapsedTime,
  useManualTimer,
} from '@/features/stage/useManualTimer';

describe('useManualTimer', () => {
  let appStateListener: ((nextState: AppStateStatus) => void) | undefined;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-09-08T20:00:00.000Z'));
    jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_event, listener) => {
        appStateListener = listener;
        return { remove: jest.fn() };
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
    appStateListener = undefined;
  });

  it('mantém instâncias independentes e controla início, pausa, retomada e reinício', async () => {
    const first = await renderHook(() => useManualTimer());
    const second = await renderHook(() => useManualTimer());

    await act(() => first.result.current.start());
    await act(() => jest.advanceTimersByTime(1_250));

    expect(first.result.current.status).toBe('running');
    expect(first.result.current.elapsedMs).toBe(1_250);
    expect(second.result.current).toMatchObject({
      elapsedMs: 0,
      status: 'idle',
    });

    await act(() => first.result.current.pause());
    await act(() => jest.advanceTimersByTime(2_000));

    expect(first.result.current).toMatchObject({
      elapsedMs: 1_250,
      status: 'paused',
    });

    await act(() => first.result.current.start());
    await act(() => jest.advanceTimersByTime(1_000));

    expect(first.result.current.elapsedMs).toBe(2_250);

    await act(() => first.result.current.reset());

    expect(first.result.current).toMatchObject({
      elapsedMs: 0,
      status: 'idle',
    });
  });

  it('ignora comandos incompatíveis com o estado atual', async () => {
    const timer = await renderHook(() => useManualTimer());

    await act(() => timer.result.current.pause());
    expect(timer.result.current.status).toBe('idle');

    await act(() => timer.result.current.start());
    await act(() => timer.result.current.start());
    expect(timer.result.current.status).toBe('running');
  });

  it('reposiciona a execução e continua contando do novo tempo', async () => {
    const timer = await renderHook(() => useManualTimer());

    await act(() => timer.result.current.start());
    await act(() => jest.advanceTimersByTime(3_000));
    await act(() => timer.result.current.seekTo(25_000));

    expect(timer.result.current).toMatchObject({
      elapsedMs: 25_000,
      status: 'running',
    });

    await act(() => jest.advanceTimersByTime(1_000));

    expect(timer.result.current.elapsedMs).toBe(26_000);
  });

  it('reposiciona sem iniciar nem retomar a contagem', async () => {
    const timer = await renderHook(() => useManualTimer());

    await act(() => timer.result.current.seekTo(12_345));
    expect(timer.result.current).toMatchObject({
      elapsedMs: 12_345,
      status: 'idle',
    });

    await act(() => timer.result.current.start());
    await act(() => timer.result.current.pause());
    await act(() => timer.result.current.seekTo(20_000));
    await act(() => jest.advanceTimersByTime(1_000));

    expect(timer.result.current).toMatchObject({
      elapsedMs: 20_000,
      status: 'paused',
    });
  });

  it('limita saltos negativos a zero e ignora tempos não finitos', async () => {
    const timer = await renderHook(() => useManualTimer());

    await act(() => timer.result.current.seekTo(-1));
    expect(timer.result.current.elapsedMs).toBe(0);

    await act(() => timer.result.current.seekTo(Number.NaN));
    await act(() => timer.result.current.seekTo(Number.POSITIVE_INFINITY));

    expect(timer.result.current).toMatchObject({
      elapsedMs: 0,
      status: 'idle',
    });
  });

  it('recalcula o tempo real ao voltar ao primeiro plano', async () => {
    const timer = await renderHook(() => useManualTimer());

    await act(() => timer.result.current.start());
    await act(() => jest.advanceTimersByTime(1_000));
    expect(timer.result.current.elapsedMs).toBe(1_000);

    await act(() => appStateListener?.('background'));
    jest.setSystemTime(new Date('2026-09-08T20:00:11.000Z'));
    expect(timer.result.current.elapsedMs).toBe(1_000);

    await act(() => appStateListener?.('active'));
    expect(timer.result.current.elapsedMs).toBe(11_000);
  });

  it('mantém o tempo parado ao voltar ao primeiro plano depois de uma pausa', async () => {
    const timer = await renderHook(() => useManualTimer());

    await act(() => timer.result.current.start());
    await act(() => jest.advanceTimersByTime(1_500));
    await act(() => timer.result.current.pause());
    jest.setSystemTime(new Date('2026-09-08T20:00:12.000Z'));

    await act(() => appStateListener?.('active'));

    expect(timer.result.current).toMatchObject({
      elapsedMs: 1_500,
      status: 'paused',
    });
  });

  it('formata o tempo decorrido em minutos e segundos', () => {
    expect(formatElapsedTime(0)).toBe('00:00');
    expect(formatElapsedTime(65_999)).toBe('01:05');
  });
});
