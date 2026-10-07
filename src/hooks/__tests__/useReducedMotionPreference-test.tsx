import { act, renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';

describe('useReducedMotionPreference', () => {
  const originalWindowDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'window',
  );
  const originalPlatformDescriptor = Object.getOwnPropertyDescriptor(
    Platform,
    'OS',
  );
  let mediaMatches = false;
  let onMediaChange: (() => void) | undefined;
  const removeMediaListener = jest.fn();
  const addMediaListener = jest.fn((_event: string, listener: () => void) => {
    onMediaChange = listener;
  });

  beforeEach(() => {
    mediaMatches = false;
    onMediaChange = undefined;
    addMediaListener.mockClear();
    removeMediaListener.mockClear();
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'web',
    });

    const mediaQuery = {
      addEventListener: addMediaListener,
      get matches() {
        return mediaMatches;
      },
      removeEventListener: removeMediaListener,
    } as unknown as MediaQueryList;

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { matchMedia: jest.fn(() => mediaQuery) },
    });
  });

  afterAll(() => {
    if (originalWindowDescriptor) {
      Object.defineProperty(globalThis, 'window', originalWindowDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, 'window');
    }
    if (originalPlatformDescriptor) {
      Object.defineProperty(Platform, 'OS', originalPlatformDescriptor);
    }
  });

  it('tracks Web prefers-reduced-motion changes without remounting', async () => {
    mediaMatches = true;
    const { result, unmount } = await renderHook(() =>
      useReducedMotionPreference(),
    );

    expect(result.current).toBe(true);
    expect(addMediaListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );

    await act(async () => {
      mediaMatches = false;
      onMediaChange?.();
    });

    expect(result.current).toBe(false);

    await act(async () => {
      unmount();
    });
  });
});
