import { act, renderHook } from '@testing-library/react-native';
import {
  Animated,
  PanResponder,
  Platform,
  type GestureResponderEvent,
  type PanResponderCallbacks,
  type PanResponderGestureState,
} from 'react-native';

import { useNavigationDrawer } from '@/features/navigation/hooks/useNavigationDrawer';
import type { NavigationScreenKind } from '@/features/navigation/types';
import { motion } from '@/theme/tokens';

let mockReducedMotion = false;
jest.mock('@/hooks/useReducedMotionPreference', () => ({
  useReducedMotionPreference: () => mockReducedMotion,
}));

describe('useNavigationDrawer', () => {
  const originalPlatform = Object.getOwnPropertyDescriptor(Platform, 'OS');
  const options = {
    persistentSidebar: false,
    screenKind: 'main' as const,
    width: 400,
  };
  let gesture: PanResponderCallbacks;
  let animations: {
    config: Animated.TimingAnimationConfig;
    stop: jest.Mock;
    finish: (finished: boolean) => void;
  }[];

  beforeEach(() => {
    mockReducedMotion = false;
    animations = [];
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'android',
    });
    jest.spyOn(PanResponder, 'create').mockImplementation((callbacks) => {
      gesture = callbacks;
      return { panHandlers: {} };
    });
    jest.spyOn(Animated, 'timing').mockImplementation((_value, config) => {
      let complete: ((result: { finished: boolean }) => void) | undefined;
      const stop = jest.fn();
      animations.push({
        config,
        stop,
        finish: (finished) => complete?.({ finished }),
      });
      return {
        start: (callback) => {
          complete = callback;
        },
        stop,
        reset: jest.fn(),
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalPlatform)
      Object.defineProperty(Platform, 'OS', originalPlatform);
  });

  it('anima a abertura e mantém o modal até concluir o fechamento', async () => {
    const { result } = await renderHook(() => useNavigationDrawer(options));
    expect(result.current.drawerOpen).toBe(false);
    await act(() => result.current.openDrawer());
    expect(result.current.drawerOpen).toBe(true);
    expect(animations[0].config).toMatchObject({
      duration: motion.layerOpen,
      toValue: 0,
      useNativeDriver: true,
    });

    await act(() => result.current.closeDrawer());
    expect(animations[0].stop).toHaveBeenCalledTimes(1);
    expect(result.current.drawerOpen).toBe(true);
    expect(animations[1].config).toMatchObject({
      duration: motion.layerClose,
      toValue: -344,
      useNativeDriver: true,
    });
    await act(() => animations[1].finish(true));
    expect(result.current.drawerOpen).toBe(false);
  });

  it('uma animação interrompida não fecha uma abertura nova', async () => {
    const { result } = await renderHook(() => useNavigationDrawer(options));
    await act(() => result.current.openDrawer());
    await act(() => result.current.closeDrawer());
    await act(() => animations[1].finish(false));
    expect(result.current.drawerOpen).toBe(true);
    await act(() => result.current.openDrawer());
    expect(animations[1].stop).toHaveBeenCalledTimes(1);
    expect(animations[2].config.toValue).toBe(0);
    await act(() => result.current.closeDrawer());
    await act(() => animations[3].finish(true));
    expect(result.current.drawerOpen).toBe(false);
  });

  it('abre e fecha imediatamente com movimento reduzido, respeitando a largura máxima', async () => {
    mockReducedMotion = true;
    const setValue = jest.spyOn(Animated.Value.prototype, 'setValue');
    const { result } = await renderHook(() =>
      useNavigationDrawer({ ...options, width: 1000 }),
    );
    await act(() => result.current.openDrawer());
    expect(result.current.drawerOpen).toBe(true);
    expect(setValue).toHaveBeenLastCalledWith(0);
    await act(() => result.current.closeDrawer());
    expect(result.current.drawerOpen).toBe(false);
    expect(setValue).toHaveBeenLastCalledWith(-360);
    expect(animations).toHaveLength(0);
  });

  it('encerra a animação pendente se a preferência mudar durante o fechamento', async () => {
    const { result, rerender } = await renderHook(() =>
      useNavigationDrawer(options),
    );
    await act(() => result.current.openDrawer());
    await act(() => result.current.closeDrawer());
    mockReducedMotion = true;
    await rerender(undefined);
    expect(animations[1].stop).toHaveBeenCalledTimes(1);
    expect(result.current.drawerOpen).toBe(false);
  });

  it.each([
    {
      platform: 'android',
      screenKind: 'main',
      persistentSidebar: false,
      dx: 24,
      dy: 3,
      expected: true,
    },
    {
      platform: 'ios',
      screenKind: 'main',
      persistentSidebar: false,
      dx: 24,
      dy: 3,
      expected: false,
    },
    {
      platform: 'android',
      screenKind: 'detail',
      persistentSidebar: false,
      dx: 24,
      dy: 3,
      expected: false,
    },
    {
      platform: 'android',
      screenKind: 'edit',
      persistentSidebar: false,
      dx: 24,
      dy: 3,
      expected: false,
    },
    {
      platform: 'android',
      screenKind: 'main',
      persistentSidebar: true,
      dx: 24,
      dy: 3,
      expected: false,
    },
    {
      platform: 'android',
      screenKind: 'main',
      persistentSidebar: false,
      dx: 7,
      dy: 3,
      expected: false,
    },
    {
      platform: 'android',
      screenKind: 'main',
      persistentSidebar: false,
      dx: 24,
      dy: 40,
      expected: false,
    },
  ])(
    'arbitra a abertura em $platform/$screenKind (dx=$dx, dy=$dy, sidebar=$persistentSidebar)',
    async ({ platform, screenKind, persistentSidebar, dx, dy, expected }) => {
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        value: platform,
      });
      await renderHook(() =>
        useNavigationDrawer({
          ...options,
          screenKind: screenKind as NavigationScreenKind,
          persistentSidebar,
        }),
      );
      expect(
        gesture.onMoveShouldSetPanResponder?.(
          {} as GestureResponderEvent,
          { dx, dy } as PanResponderGestureState,
        ),
      ).toBe(expected);
    },
  );

  it('abre somente após completar a distância mínima do gesto', async () => {
    const { result } = await renderHook(() => useNavigationDrawer(options));
    await act(() =>
      gesture.onPanResponderRelease?.(
        {} as GestureResponderEvent,
        { dx: 47, dy: 0, vx: 0 } as PanResponderGestureState,
      ),
    );
    expect(result.current.drawerOpen).toBe(false);
    await act(() =>
      gesture.onPanResponderRelease?.(
        {} as GestureResponderEvent,
        { dx: 48, dy: 0, vx: 0 } as PanResponderGestureState,
      ),
    );
    expect(result.current.drawerOpen).toBe(true);
  });

  it('aceita uma abertura curta rápida sem aceitar um pequeno arraste lento', async () => {
    const { result } = await renderHook(() => useNavigationDrawer(options));
    await act(() =>
      gesture.onPanResponderRelease?.(
        {} as GestureResponderEvent,
        { dx: 24, dy: 2, vx: 0.1 } as PanResponderGestureState,
      ),
    );
    expect(result.current.drawerOpen).toBe(false);
    await act(() =>
      gesture.onPanResponderRelease?.(
        {} as GestureResponderEvent,
        { dx: 24, dy: 2, vx: 0.4 } as PanResponderGestureState,
      ),
    );
    expect(result.current.drawerOpen).toBe(true);
  });

  it('reconhece a abertura Android nativamente e rejeita uma conclusão cancelada', async () => {
    const { result } = await renderHook(() => useNavigationDrawer(options));
    expect(result.current.androidEdgeGesture.config).toMatchObject({
      activeOffsetXEnd: 8,
      enabled: true,
      failOffsetYEnd: 18,
      failOffsetYStart: -18,
      maxPointers: 1,
      runOnJS: true,
    });
    await act(() =>
      result.current.androidEdgeGesture.handlers.onEnd?.(
        { translationX: 80, translationY: 0, velocityX: 350 } as never,
        false,
      ),
    );
    expect(result.current.drawerOpen).toBe(false);
    await act(() =>
      result.current.androidEdgeGesture.handlers.onEnd?.(
        { translationX: 24, translationY: 2, velocityX: 350 } as never,
        true,
      ),
    );
    expect(result.current.drawerOpen).toBe(true);
    expect(result.current.androidEdgeGesture.config.enabled).toBe(false);
  });
});
