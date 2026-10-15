import { act, renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';

import {
  SectionTransitionProvider,
  useSectionTransition,
} from '@/features/navigation/SectionTransition';
import type { BandSection } from '@/features/navigation/routes';

describe('SectionTransitionProvider', () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    jest.useFakeTimers();
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.restoreAllMocks();
    jest.useRealTimers();
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: originalPlatform,
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SectionTransitionProvider>{children}</SectionTransitionProvider>
  );

  it('escolhe a direção da animação e restaura a animação padrão após o tempo limite', async () => {
    const { result } = await renderHook(() => useSectionTransition(), {
      wrapper,
    });

    expect(result.current.animationTypeForReplace).toBe('push');

    await act(async () => result.current.setSectionTransition('shows', 'band'));
    expect(result.current.animationTypeForReplace).toBe('push');

    await act(async () => result.current.setSectionTransition('band', 'shows'));
    expect(result.current.animationTypeForReplace).toBe('pop');

    await act(async () => jest.advanceTimersByTime(1200));
    expect(result.current.animationTypeForReplace).toBe('push');
  });

  it.each([
    ['stage', 'shows'],
    ['shows', 'stage'],
    ['shows', 'shows'],
  ] as const)(
    'reseta a animação para uma transição não ordenada (%s → %s)',
    async (current, target) => {
      const { result } = await renderHook(() => useSectionTransition(), {
        wrapper,
      });

      await act(async () =>
        result.current.setSectionTransition('band', 'shows'),
      );
      expect(result.current.animationTypeForReplace).toBe('pop');

      await act(async () =>
        result.current.setSectionTransition(
          current as BandSection,
          target as BandSection,
        ),
      );

      expect(result.current.animationTypeForReplace).toBe('push');
    },
  );

  it('sempre reseta animações de substituição na Web', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    const { result } = await renderHook(() => useSectionTransition(), {
      wrapper,
    });

    await act(async () => result.current.setSectionTransition('band', 'shows'));

    expect(result.current.animationTypeForReplace).toBe('push');
  });

  it('limpa a animação e o temporizador ao solicitar reset ou desmontar', async () => {
    const { result, unmount } = await renderHook(() => useSectionTransition(), {
      wrapper,
    });
    const setTimeoutSpy = jest.spyOn(globalThis, 'setTimeout');
    const clearTimeoutSpy = jest.spyOn(globalThis, 'clearTimeout');

    await act(async () => result.current.setSectionTransition('band', 'shows'));
    const firstTransitionTimer = setTimeoutSpy.mock.results.at(-1)?.value;
    await act(async () => result.current.resetSectionTransition());
    expect(result.current.animationTypeForReplace).toBe('push');
    expect(clearTimeoutSpy).toHaveBeenCalledWith(firstTransitionTimer);

    await act(async () => result.current.setSectionTransition('band', 'shows'));
    const secondTransitionTimer = setTimeoutSpy.mock.results.at(-1)?.value;
    await unmount();

    expect(clearTimeoutSpy).toHaveBeenCalledWith(secondTransitionTimer);
  });
});
