import { act, renderHook } from '@testing-library/react-native';

import {
  formatElapsedTime,
  useManualTimer,
} from '@/features/stage/useManualTimer';

describe('useManualTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-09-08T20:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
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

  it('formata o tempo decorrido em minutos e segundos', () => {
    expect(formatElapsedTime(0)).toBe('00:00');
    expect(formatElapsedTime(65_999)).toBe('01:05');
  });
});
