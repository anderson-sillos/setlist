import { act, renderHook } from '@testing-library/react-native';
import { Animated, Platform } from 'react-native';

import { useAndroidDrawerCloseGesture } from '@/features/navigation/hooks/useAndroidDrawerCloseGesture';
import { motion } from '@/theme/tokens';

let mockReducedMotion = false;
jest.mock('@/hooks/useReducedMotionPreference', () => ({
  useReducedMotionPreference: () => mockReducedMotion,
}));

describe('useAndroidDrawerCloseGesture', () => {
  const originalPlatform = Object.getOwnPropertyDescriptor(Platform, 'OS');
  let translateX: Animated.Value;
  let onClose: jest.Mock;
  let animations: { start: jest.Mock; stop: jest.Mock; reset: jest.Mock }[];

  beforeEach(() => {
    mockReducedMotion = false;
    animations = [];
    translateX = new Animated.Value(0);
    onClose = jest.fn();
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'android',
    });
    jest.spyOn(Animated, 'timing').mockImplementation(() => {
      const animation = { start: jest.fn(), stop: jest.fn(), reset: jest.fn() };
      animations.push(animation);
      return animation;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalPlatform)
      Object.defineProperty(Platform, 'OS', originalPlatform);
  });

  const options = () => ({
    closing: false,
    onClose,
    translateX,
    visible: true,
    width: 330,
  });

  it('configura captura horizontal nativa e deixa a rolagem vertical disponível', async () => {
    const { result } = await renderHook(() =>
      useAndroidDrawerCloseGesture(options()),
    );
    expect(result.current.config).toMatchObject({
      activeOffsetXStart: -8,
      enabled: true,
      failOffsetYEnd: 18,
      failOffsetYStart: -18,
      maxPointers: 1,
      runOnJS: true,
      shouldCancelWhenOutside: false,
    });
  });

  it('acompanha o dedo, limitando o deslocamento à largura do menu', async () => {
    const setValue = jest.spyOn(translateX, 'setValue');
    const stopAnimation = jest.spyOn(translateX, 'stopAnimation');
    const { result } = await renderHook(() =>
      useAndroidDrawerCloseGesture(options()),
    );
    await act(() => result.current.handlers.onStart?.({} as never));
    expect(stopAnimation).toHaveBeenCalled();
    await act(() =>
      result.current.handlers.onUpdate?.({ translationX: -90 } as never),
    );
    expect(setValue).toHaveBeenLastCalledWith(-90);
    await act(() =>
      result.current.handlers.onUpdate?.({ translationX: -500 } as never),
    );
    expect(setValue).toHaveBeenLastCalledWith(-330);
    await act(() =>
      result.current.handlers.onUpdate?.({ translationX: 20 } as never),
    );
    expect(setValue).toHaveBeenLastCalledWith(0);
  });

  it.each([
    ['lento', -100, 0],
    ['rápido curto', -24, -350],
  ])(
    'completa o fechamento %s uma única vez',
    async (_label, translationX, velocityX) => {
      const { result } = await renderHook(() =>
        useAndroidDrawerCloseGesture(options()),
      );
      await act(() => result.current.handlers.onStart?.({} as never));
      await act(() =>
        result.current.handlers.onEnd?.(
          { translationX, translationY: 4, velocityX } as never,
          true,
        ),
      );
      await act(() => result.current.handlers.onFinalize?.({} as never, true));
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(Animated.timing).not.toHaveBeenCalled();
    },
  );

  it('restaura a posição quando um arraste curto não completa o fechamento', async () => {
    const { result } = await renderHook(() =>
      useAndroidDrawerCloseGesture(options()),
    );
    await act(() => result.current.handlers.onStart?.({} as never));
    await act(() =>
      result.current.handlers.onEnd?.(
        { translationX: -14, translationY: 0, velocityX: -40 } as never,
        true,
      ),
    );
    await act(() => result.current.handlers.onFinalize?.({} as never, true));
    expect(onClose).not.toHaveBeenCalled();
    expect(Animated.timing).toHaveBeenCalledTimes(1);
    expect(Animated.timing).toHaveBeenCalledWith(translateX, {
      duration: motion.layerClose,
      toValue: 0,
      useNativeDriver: true,
    });
  });

  it('restaura um gesto cancelado sem fechar o menu', async () => {
    const { result } = await renderHook(() =>
      useAndroidDrawerCloseGesture(options()),
    );
    await act(() => result.current.handlers.onStart?.({} as never));
    await act(() => result.current.handlers.onFinalize?.({} as never, false));
    expect(onClose).not.toHaveBeenCalled();
    expect(Animated.timing).toHaveBeenCalledTimes(1);
  });

  it('um cancelamento durante o fechamento por botão não reabre o menu', async () => {
    let currentOptions = options();
    const { result, rerender } = await renderHook(() =>
      useAndroidDrawerCloseGesture(currentOptions),
    );
    await act(() => result.current.handlers.onStart?.({} as never));
    currentOptions = { ...currentOptions, closing: true };
    await rerender(undefined);
    await act(() =>
      result.current.handlers.onEnd?.(
        { translationX: -30, translationY: 0, velocityX: 0 } as never,
        false,
      ),
    );
    await act(() => result.current.handlers.onFinalize?.({} as never, false));
    expect(result.current.config.enabled).toBe(false);
    expect(Animated.timing).not.toHaveBeenCalled();
  });

  it('restaura imediatamente quando a pessoa prefere movimento reduzido', async () => {
    mockReducedMotion = true;
    const setValue = jest.spyOn(translateX, 'setValue');
    const { result } = await renderHook(() =>
      useAndroidDrawerCloseGesture(options()),
    );
    await act(() => result.current.handlers.onStart?.({} as never));
    await act(() => result.current.handlers.onFinalize?.({} as never, false));
    expect(setValue).toHaveBeenLastCalledWith(0);
    expect(Animated.timing).not.toHaveBeenCalled();
  });

  it('interrompe a restauração ao desmontar', async () => {
    const { result, unmount } = await renderHook(() =>
      useAndroidDrawerCloseGesture(options()),
    );
    await act(() => result.current.handlers.onStart?.({} as never));
    await act(() => result.current.handlers.onFinalize?.({} as never, false));
    await unmount();
    expect(animations[0].stop).toHaveBeenCalled();
  });

  it('mantém o reconhecimento anterior do iOS', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'ios',
    });
    const { result } = await renderHook(() =>
      useAndroidDrawerCloseGesture(options()),
    );
    expect(result.current.config.enabled).toBe(false);
  });
});
