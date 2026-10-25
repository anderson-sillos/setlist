import { act, renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';

import type { Song } from '@/domain';
import {
  createLyricBlock,
  createLyricDocument,
  createLyricLine,
  createSong,
} from '@/testing/factories';
import { useTimedLyricsSession } from '@/features/repertoire/useTimedLyricsSession';

function synchronizedSong(): Song {
  return createSong({
    estimatedDurationMs: 20_000,
    id: 'timed-song',
    lyricStatus: 'synchronized',
    lyrics: createLyricDocument({
      blocks: [
        createLyricBlock({
          id: 'timed-block',
          lines: [
            createLyricLine({
              id: 'line-one',
              startTimeMs: 0,
              text: 'Primeira',
            }),
            createLyricLine({
              id: 'line-two',
              startTimeMs: 5_000,
              text: 'Segunda',
            }),
          ],
        }),
      ],
    }),
  });
}

describe('useTimedLyricsSession', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-25T12:00:00.000Z'));
    jest.spyOn(AppState, 'addEventListener').mockImplementation(() => ({
      remove: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('habilita o tempo local somente para letra sincronizada válida', async () => {
    const song = synchronizedSong();
    const session = await renderHook(() => useTimedLyricsSession(song));

    expect(session.result.current.isEligible).toBe(true);
    expect(session.result.current.status).toBe('idle');
    expect(session.result.current.durationMs).toBe(20_000);
    expect(session.result.current.activeGroup?.id).toBe('line-one');

    await act(() => session.result.current.start());
    await act(() => jest.advanceTimersByTime(5_000));

    expect(session.result.current.activeGroup?.id).toBe('line-two');
  });

  it.each([
    createSong({ lyricStatus: 'static' }),
    createSong({ lyricStatus: 'incomplete' }),
    createSong({ lyricStatus: 'missing' }),
    createSong({ lyricStatus: 'instrumental' }),
  ])(
    'preserva o modo de leitura manual para estado não elegível',
    async (song) => {
      const session = await renderHook(() => useTimedLyricsSession(song));

      expect(session.result.current.isEligible).toBe(false);
      expect(session.result.current.projection).toBeNull();
      expect(session.result.current.activeGroup).toBeNull();
    },
  );

  it('encerra a sessão se a letra perder a sincronização', async () => {
    const synchronized = synchronizedSong();
    const session = await renderHook(
      (props: { readonly song: Song }) => useTimedLyricsSession(props.song),
      { initialProps: { song: synchronized } },
    );

    await act(() => session.result.current.start());
    await act(() => jest.advanceTimersByTime(2_000));
    await session.rerender({
      song: { ...synchronized, lyricStatus: 'static' },
    });

    expect(session.result.current.isEligible).toBe(false);
    expect(session.result.current).toMatchObject({
      elapsedMs: 0,
      status: 'idle',
    });
  });

  it('preserva o relógio quando uma letra sincronizada é atualizada', async () => {
    const original = synchronizedSong();
    const session = await renderHook(
      (props: { readonly song: Song }) => useTimedLyricsSession(props.song),
      { initialProps: { song: original } },
    );

    await act(() => session.result.current.start());
    await act(() => jest.advanceTimersByTime(3_000));
    await session.rerender({
      song: {
        ...original,
        lyrics: createLyricDocument({
          blocks: [
            createLyricBlock({
              id: 'updated-block',
              lines: [
                createLyricLine({
                  id: 'updated-first',
                  startTimeMs: 0,
                  text: 'Atualizada',
                }),
                createLyricLine({
                  id: 'updated-second',
                  startTimeMs: 4_000,
                  text: 'Nova marca',
                }),
              ],
            }),
          ],
        }),
      },
    });

    expect(session.result.current).toMatchObject({
      elapsedMs: 3_000,
      isEligible: true,
      status: 'running',
    });
    expect(session.result.current.projection?.groups[1]?.id).toBe(
      'updated-second',
    );
  });

  it('encerra temporizadores e começa do zero ao abrir uma nova sessão', async () => {
    const firstSession = await renderHook(() =>
      useTimedLyricsSession(synchronizedSong()),
    );
    const clearIntervalSpy = jest.spyOn(globalThis, 'clearInterval');

    await act(() => firstSession.result.current.start());
    await act(() => jest.advanceTimersByTime(2_000));
    expect(firstSession.result.current.elapsedMs).toBe(2_000);
    await act(() => firstSession.unmount());

    expect(clearIntervalSpy).toHaveBeenCalled();
    const nextSession = await renderHook(() =>
      useTimedLyricsSession(synchronizedSong()),
    );
    expect(nextSession.result.current).toMatchObject({
      elapsedMs: 0,
      status: 'idle',
    });
  });
});
